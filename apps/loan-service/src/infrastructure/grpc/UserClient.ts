import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

// Load proto locally since we copied it into the service
const PROTO_PATH = path.join(__dirname, 'user.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user as any;

const client = new userProto.UserService(
  process.env.USER_SERVICE_URL || 'localhost:50051',
  grpc.credentials.createInsecure()
);

export class UserClient {
  static async validateUser(userId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      client.ValidateUser({ userId }, (error: any, response: any) => {
        if (error) {
          console.error('gRPC Error validating user:', error);
          return resolve(false); // Fail gracefully or reject
        }
        resolve(response.isValid);
      });
    });
  }
}
