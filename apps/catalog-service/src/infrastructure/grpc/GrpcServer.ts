import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { logger } from '../../utils/logger';

export class GrpcServer {
  private server: grpc.Server;

  constructor() {
    this.server = new grpc.Server();
  }

  public start() {
    const PROTO_PATH = path.join(__dirname, 'catalog.proto');
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const catalogProto = grpc.loadPackageDefinition(packageDefinition).catalog as any;

    this.server.addService(catalogProto.CatalogService.service, {
      ValidateISBN: this.validateISBN.bind(this),
    });

    const port = process.env.GRPC_PORT || 50052;
    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, bindPort) => {
        if (err) {
          logger.error('[Catalog gRPC] Failed to bind server:', err);
          return;
        }
        this.server.start();
        logger.info(`[Catalog gRPC] Server running on port ${bindPort}`);
      }
    );
  }

  private async validateISBN(call: any, callback: any) {
    const isbn = call.request.isbn;
    logger.info(`[Catalog gRPC] Received ValidateISBN request for ISBN: ${isbn}`);
    
    // Simple mock logic for validation. In a real scenario, it queries the Database.
    const isValid = isbn && isbn.length >= 10;
    
    callback(null, {
      isValid: isValid,
      title: isValid ? 'Sample Book Title' : '',
      author: isValid ? 'Sample Author' : '',
    });
  }
}
