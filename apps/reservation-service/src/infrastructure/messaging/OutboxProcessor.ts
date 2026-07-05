import { IReservationRepository } from '../../domain/IReservationRepository';
import { IMessageBroker } from '../../domain/IMessageBroker';
import { logger } from '../../utils/logger';

export class OutboxProcessor {
  private intervalId?: NodeJS.Timeout;
  private isProcessing = false;

  constructor(
    private repository: IReservationRepository,
    private broker: IMessageBroker
  ) {}

  start(intervalMs = 5000) {
    logger.info(`📦 Iniciando OutboxProcessor (Patrón Outbox Transaccional) cada ${intervalMs}ms...`);
    this.intervalId = setInterval(() => this.processOutbox(), intervalMs);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private async processOutbox() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingEvents = await this.repository.getPendingOutboxEvents();
      if (pendingEvents.length === 0) {
        this.isProcessing = false;
        return;
      }

      logger.info(`📦 [Outbox] Procesando ${pendingEvents.length} eventos pendientes...`);
      for (const event of pendingEvents) {
        try {
          // Publish to Kafka
          await this.broker.publishKafka(event.eventType, {
            eventId: event.id,
            type: event.eventType,
            payload: event.payload,
            timestamp: event.createdAt
          });

          // Publish to MQTT if related to room status or reservation
          if (event.payload.roomId) {
            const mqttTopic = `library/rooms/${event.payload.roomId}/status`;
            await this.broker.publishMqtt(mqttTopic, {
              roomId: event.payload.roomId,
              status: event.payload.roomStatus || (event.eventType === 'reservation.created' ? 'RESERVED' : 'AVAILABLE'),
              updatedAt: event.createdAt
            });
          }

          // Mark as published in Outbox table
          await this.repository.markOutboxPublished(event.id);
          logger.info(`✅ [Outbox] Evento ${event.id} (${event.eventType}) publicado y marcado como PUBLISHED`);
        } catch (err) {
          logger.error(`❌ [Outbox] Error publicando evento ${event.id}:`, err);
        }
      }
    } catch (err) {
      logger.error('❌ Error consultando tabla Outbox:', err);
    } finally {
      this.isProcessing = false;
    }
  }
}
