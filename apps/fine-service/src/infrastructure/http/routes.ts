import { Router } from 'express';
import Stripe from 'stripe';
import { PostgresFineRepository } from '../database/PostgresFineRepository';
import { GetFinesByUserUseCase, GetAllFinesUseCase } from '../../application/use-cases/GetFinesUseCase';
import { CreatePaymentIntentUseCase, ConfirmPaymentUseCase } from '../../application/use-cases/PaymentUseCases';
import { KafkaProducer } from '../messaging/KafkaProducer';
import { logger } from '../../utils/logger';

export const fineRouter = Router();

// We must initialize Stripe with the Secret Key
const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

const repository = new PostgresFineRepository();
const getFinesByUserUseCase = new GetFinesByUserUseCase(repository);
const getAllFinesUseCase = new GetAllFinesUseCase(repository);
const createPaymentIntentUseCase = new CreatePaymentIntentUseCase(repository, stripe);
const confirmPaymentUseCase = new ConfirmPaymentUseCase(repository);

fineRouter.get('/user/:userId', async (req, res) => {
  try {
    const fines = await getFinesByUserUseCase.execute(req.params.userId);
    res.json(fines);
  } catch (error) {
    logger.error('Error fetching fines', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

fineRouter.get('/', async (req, res) => {
  try {
    const fines = await getAllFinesUseCase.execute();
    res.json(fines);
  } catch (error) {
    logger.error('Error fetching all fines', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

fineRouter.post('/:id/pay', async (req, res) => {
  try {
    const clientSecret = await createPaymentIntentUseCase.execute(req.params.id);
    res.json({ clientSecret });
  } catch (error: any) {
    logger.error('Error creating payment intent', error);
    res.status(400).json({ error: error.message });
  }
});

// Stripe Webhook (Usually we would verify the signature, but for test mode we simplify)
import express from 'express';
fineRouter.post('/webhook', express.json(), async (req, res) => {
  const event = req.body;

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    try {
      await confirmPaymentUseCase.execute(paymentIntent.id);
      logger.info(`[Webhook] Payment successful for intent ${paymentIntent.id}`);
      
      // Emit to Kafka so notification-service sends the success email
      const fineId = paymentIntent.metadata?.fineId;
      const userId = paymentIntent.metadata?.userId;
      
      if (userId) {
        await KafkaProducer.emit('fine.paid', {
          userId,
          fineId,
          amount: paymentIntent.amount / 100
        });
      }
      
    } catch (err) {
      logger.error('Error confirming payment', err);
    }
  }

  res.status(200).send('Event received');
});
