import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { logger } from '../../utils/logger';

import { UserUseCases } from '../../application/UserUseCases';

export class GrpcServer {
  private server: grpc.Server;
  private userUseCases: UserUseCases;

  constructor(userUseCases: UserUseCases) {
    this.server = new grpc.Server();
    this.userUseCases = userUseCases;
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
          logger.error('[User gRPC] Failed to bind server:', err);
          return;
        }
        this.server.start();
        logger.info(`[User gRPC] Server running on port ${bindPort}`);
      }
    );
  }

  private async validateUser(call: any, callback: any) {
    const userId = call.request.userId;
    logger.info(`[User gRPC] Received ValidateUser request for userId: ${userId}`);
    
    try {
      const user = await this.userUseCases.getUserById(userId);
      
      if (user) {
        logger.info(`[User gRPC] Successfully validated user: ${user.email} (ID: ${userId})`);
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
        const mainRole = user.roles && user.roles.length > 0 ? user.roles[0].name : 'STUDENT';
        
        callback(null, {
          isValid: true,
          role: mainRole,
          name: name
        });
      } else {
        logger.warn(`[User gRPC] User validation failed for userId: ${userId} - Not Found`);
        callback(null, {
          isValid: false,
          role: '',
          name: ''
        });
      }
    } catch (error: any) {
      logger.error(`[User gRPC] Error validating user ${userId}:`, error);
      callback(null, {
        isValid: false,
        role: '',
        name: ''
      });
    }
  }

  private async getPermissions(call: any, callback: any) {
    const userId = call.request.userId;
    logger.info(`[User gRPC] Received GetPermissions request for userId: ${userId}`);
    
    callback(null, {
      permissions: ['read:books', 'borrow:books'],
    });
  }
}
