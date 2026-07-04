import { PhysicalStock } from './PhysicalStock';

export interface IInventoryRepository {
  findByIsbn(isbn: string): Promise<PhysicalStock | null>;
  save(stock: PhysicalStock): Promise<void>;
  findLowStock(threshold: number): Promise<PhysicalStock[]>;
}
