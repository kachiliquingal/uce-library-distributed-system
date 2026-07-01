import { Router } from 'express';
import Stripe from 'stripe';
import { PostgresFineRepository } from '../database/PostgresFineRepository';
import { GetFinesByUserUseCase, GetAllFinesUseCase } from '../../application/use-cases/GetFinesUseCase';
import { CreatePaymentIntentUseCase, ConfirmPaymentUseCase } from '../../application/use-cases/PaymentUseCases';
import { KafkaProducer } from '../messaging/KafkaProducer';
import { logger } from '../../utils/logger';
import { UserClient } from './UserClient';

export const fineRouter = Router();

// We must initialize Stripe with the Secret Key
const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

const repository = new PostgresFineRepository();
const getFinesByUserUseCase = new GetFinesByUserUseCase(repository);
const getAllFinesUseCase = new GetAllFinesUseCase(repository);
const createPaymentIntentUseCase = new CreatePaymentIntentUseCase(repository, stripe);
const confirmPaymentUseCase = new ConfirmPaymentUseCase(repository);

/**
 * @swagger
 * /api/fines/user/{userId}:
 *   get:
 *     summary: Get all fines for a specific user
 *     tags: [Fines]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user fines
 *       500:
 *         description: Internal server error
 */
fineRouter.get('/user/:userId', async (req, res) => {
  try {
    const fines = await getFinesByUserUseCase.execute(req.params.userId);
    res.json(fines);
  } catch (error) {
    logger.error('Error fetching fines', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

import { CreateFineUseCase } from '../../application/use-cases/CreateFineUseCase';
const createFineUseCase = new CreateFineUseCase(repository);

/**
 * @swagger
 * /api/fines/mock:
 *   post:
 *     summary: Create a mock fine for testing purposes
 *     tags: [Fines]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fine created successfully
 *       400:
 *         description: Bad request
 */
fineRouter.post('/mock', async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const fine = await createFineUseCase.execute(
      userId,
      'mock-loan-' + Date.now(),
      amount || 5.0,
      reason || 'Mock fine for testing'
    );
    res.json(fine);
  } catch (error: any) {
    logger.error('Error creating mock fine', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/fines:
 *   get:
 *     summary: Get all fines in the system
 *     tags: [Fines]
 *     responses:
 *       200:
 *         description: List of all fines
 *       500:
 *         description: Internal server error
 */
fineRouter.get('/', async (req, res) => {
  try {
    const fines = await getAllFinesUseCase.execute();
    res.json(fines);
  } catch (error) {
    logger.error('Error fetching all fines', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/fines/{id}/pay:
 *   post:
 *     summary: Create a Stripe PaymentIntent for a specific fine
 *     tags: [Fines]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment intent client secret
 *       400:
 *         description: Bad request
 */
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
      
      // Look up the fine from DB using the paymentIntentId (metadata may be
      // missing when the webhook is simulated from the frontend client-side)
      const allFines = await repository.findAll();
      const paidFine = allFines.find(f => f.stripePaymentIntentId === paymentIntent.id);
      
      const fineId = paidFine?.id || paymentIntent.metadata?.fineId;
      const userId = paidFine?.userId || paymentIntent.metadata?.userId;
      const amount = paidFine ? paidFine.amount : (paymentIntent.amount / 100);
      
      if (userId) {
        const userName = await UserClient.getUserName(userId);
        await KafkaProducer.emit('fine.paid', {
          userId,
          userName,
          fineId,
          amount
        });
        logger.info(`[Webhook] Emitted fine.paid event for userId=${userId} (${userName}), fineId=${fineId}`);
      } else {
        logger.warn(`[Webhook] Could not determine userId for paymentIntent ${paymentIntent.id} - notification skipped`);
      }
      
    } catch (err) {
      logger.error('Error confirming payment', err);
    }
  }

  res.status(200).send('Event received');
});
