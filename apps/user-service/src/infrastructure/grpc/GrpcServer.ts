import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

export class GrpcServer {
  private server: grpc.Server;

  constructor() {
    this.server = new grpc.Server();
  }

  public start() {
    const PROTO_PATH = path.join(__dirname, 'user.proto');
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const userProto = grpc.loadPackageDefinition(packageDefinition).user as any;

    this.server.addService(userProto.UserService.service, {
      ValidateUser: this.validateUser.bind(this),
      GetPermissions: this.getPermissions.bind(this),
    });

    const port = process.env.GRPC_PORT || 50051;
    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, bindPort) => {
        if (err) {
          console.error('[User gRPC] Failed to bind server:', err);
          return;
        }
        this.server.start();
        console.log(`[User gRPC] Server running on port ${bindPort}`);
      }
    );
  }

  private async validateUser(call: any, callback: any) {
    const userId = call.request.userId;
    console.log(`[User gRPC] Received ValidateUser request for userId: ${userId}`);
    
    // Simple mock logic for validation. Real scenario calls UserRepository.
    const isValid = !!userId;
    
    callback(null, {
      isValid: isValid,
      role: isValid ? 'STUDENT' : '',
    });
  }

  private async getPermissions(call: any, callback: any) {
    const userId = call.request.userId;
    console.log(`[User gRPC] Received GetPermissions request for userId: ${userId}`);
    
    callback(null, {
      permissions: ['read:books', 'borrow:books'],
    });
  }
}
