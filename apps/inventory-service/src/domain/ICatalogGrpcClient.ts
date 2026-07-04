export interface ICatalogGrpcClient {
  validateIsbn(isbn: string): Promise<boolean>;
}
