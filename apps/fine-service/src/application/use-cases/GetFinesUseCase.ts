import { Fine } from '../../domain/Fine';
import { FineRepository } from '../../domain/FineRepository';

export class GetFinesByUserUseCase {
  constructor(private fineRepository: FineRepository) {}

  async execute(userId: string): Promise<Fine[]> {
    return this.fineRepository.findByUserId(userId);
  }
}

export class GetAllFinesUseCase {
  constructor(private fineRepository: FineRepository) {}

  async execute(): Promise<Fine[]> {
    return this.fineRepository.findAll();
  }
}
