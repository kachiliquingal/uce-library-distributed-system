import Stripe from 'stripe';
import { FineRepository } from '../../domain/FineRepository';
import { logger } from '../../utils/logger';

export class CreatePaymentIntentUseCase {
  constructor(private fineRepository: FineRepository, private stripe: Stripe) {}

  async execute(fineId: string): Promise<string> {
    const fine = await this.fineRepository.findById(fineId);
    if (!fine) throw new Error('Fine not found');
    if (fine.status === 'PAID') throw new Error('Fine is already paid');

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(fine.amount * 100), // Stripe expects amounts in cents
      currency: 'usd',
      metadata: { fineId: fine.id, userId: fine.userId },
    });

    fine.stripePaymentIntentId = paymentIntent.id;
    await this.fineRepository.update(fine);
    
    logger.info(`[CreatePaymentIntentUseCase] Created PaymentIntent for fine ${fineId}`);
    return paymentIntent.client_secret!;
  }
}

export class ConfirmPaymentUseCase {
  constructor(private fineRepository: FineRepository) {}

  async execute(paymentIntentId: string): Promise<void> {
    const fines = await this.fineRepository.findAll();
    const fine = fines.find(f => f.stripePaymentIntentId === paymentIntentId);
    
    if (fine && fine.status !== 'PAID') {
      fine.status = 'PAID';
      await this.fineRepository.update(fine);
      logger.info(`[ConfirmPaymentUseCase] Fine ${fine.id} marked as PAID via Stripe Intent ${paymentIntentId}`);
    }
  }
}
