import { v4 as uuidv4 } from 'uuid';
import { Fine } from '../../domain/Fine';
import { FineRepository } from '../../domain/FineRepository';
import { logger } from '../../utils/logger';

export class CreateFineUseCase {
  constructor(private fineRepository: FineRepository) {}

  async execute(userId: string, loanId: string, amount: number, reason: string): Promise<Fine> {
    const fine = new Fine(
      uuidv4(),
      userId,
      loanId,
      amount,
      reason,
      'UNPAID',
      new Date()
    );
    await this.fineRepository.save(fine);
    logger.info(`[CreateFineUseCase] Created fine ${fine.id} for user ${userId} with amount ${amount}`);
    return fine;
  }
}
