import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { UserUseCases } from '../../application/UserUseCases';

const PROTO_PATH = path.resolve(__dirname, './proto/user.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user as any;

export const startGrpcServer = (userUseCases: UserUseCases) => {
  const server = new grpc.Server();

  server.addService(userProto.UserService.service, {
    ValidateUser: async (call: any, callback: any) => {
      try {
        const user = await userUseCases.getUserById(call.request.user_id);
        if (user) {
          callback(null, {
            is_valid: true,
            email: user.email,
            is_active: user.isActive,
          });
        } else {
          callback(null, { is_valid: false, email: "", is_active: false });
        }
      } catch (error) {
        callback(error, null);
      }
    },
  });

  const port = process.env.GRPC_PORT || 50051;
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err: Error | null, boundPort: number) => {
    if (err) {
      console.error('Failed to bind gRPC server', err);
      return;
    }
    console.log(`gRPC Server running at 0.0.0.0:${boundPort}`);
  });
};
