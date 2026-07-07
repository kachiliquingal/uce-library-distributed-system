import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { ICatalogGrpcClient } from '../../domain/ICatalogGrpcClient';
import { logger } from '../../utils/logger';
import { CircuitBreaker } from '../../utils/CircuitBreaker';

export class CatalogGrpcClient implements ICatalogGrpcClient {
  private client: any;
  private breaker = new CircuitBreaker({ name: 'CatalogGrpcClient', failureThreshold: 3, resetTimeoutMs: 15000 });

  constructor() {
    const PROTO_PATH = path.join(__dirname, 'catalog.proto');
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    
    const catalogProto = grpc.loadPackageDefinition(packageDefinition).catalog as any;
    
    // Dynamic IP via env var (Default points to catalog-service QA-A internal IP or load balancer)
    const catalogHost = process.env.CATALOG_GRPC_HOST || '172.31.31.146:50051'; 
    
    this.client = new catalogProto.CatalogService(
      catalogHost,
      grpc.credentials.createInsecure()
    );
  }

  validateIsbn(isbn: string): Promise<boolean> {
    return this.breaker.execute(
      () => new Promise((resolve, reject) => {
        this.client.ValidateISBN({ isbn }, (err: any, response: any) => {
          if (err) {
            logger.error(`gRPC Error connecting to CatalogService: ${err.message}`);
            return reject(err);
          }
          resolve(response.isValid);
        });
      }),
      () => false
    );
  }
}

