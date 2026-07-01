import { Fine } from './Fine';

export interface FineRepository {
  save(fine: Fine): Promise<void>;
  findById(id: string): Promise<Fine | null>;
  findByUserId(userId: string): Promise<Fine[]>;
  findAll(): Promise<Fine[]>;
  update(fine: Fine): Promise<void>;
}
