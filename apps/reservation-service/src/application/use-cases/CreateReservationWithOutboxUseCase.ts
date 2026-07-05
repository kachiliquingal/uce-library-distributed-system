import { IReservationRepository } from '../../domain/IReservationRepository';
import { IMessageBroker } from '../../domain/IMessageBroker';
import { Reservation } from '../../domain/Reservation';
import { OutboxEvent } from '../../domain/OutboxEvent';
import { logger } from '../../utils/logger';

export class CreateReservationWithOutboxUseCase {
  constructor(
    private repository: IReservationRepository,
    private broker: IMessageBroker
  ) {}

  async execute(input: {
    userId: string;
    userEmail: string;
    userName: string;
    roomId: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    purpose?: string;
    attendees?: number;
  }): Promise<Reservation> {
    // 1. Validate room exists
    const room = await this.repository.getRoomById(input.roomId);
    if (!room) {
      throw new Error(`La sala de estudio ${input.roomId} no existe.`);
    }
    if (room.currentStatus !== 'AVAILABLE') {
      throw new Error(`La sala ${room.name} no está disponible actualmente (${room.currentStatus}).`);
    }

    // 2. Enforce Today/Tomorrow Rule in Ecuador Timezone (America/Guayaquil, UTC-5)
    const nowEcuador = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
    const todayStr = nowEcuador.toISOString().split('T')[0];
    const tomorrowEcuador = new Date(nowEcuador);
    tomorrowEcuador.setDate(tomorrowEcuador.getDate() + 1);
    const tomorrowStr = tomorrowEcuador.toISOString().split('T')[0];

    if (input.date !== todayStr && input.date !== tomorrowStr) {
      throw new Error(`Las reservas de salas de estudio solo están permitidas para el día de hoy (${todayStr}) o mañana (${tomorrowStr}). Máximo 24 horas de anticipación.`);
    }

    // 3. Validate user has no active reservations
    const activeUserRes = await this.repository.findActiveByUser(input.userId);
    if (activeUserRes.length > 0) {
      throw new Error(`Ya tienes una reserva activa en curso en la ${activeUserRes[0].roomName}. Debes finalizar o esperar a que concluya tu turno para reservar otra sala.`);
    }

    // 4. Assign exactly 5 minutes duration
    const durationMinutes = 5;
    const [hours, minutes] = input.startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours || 0, minutes || 0, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const endHours = String(endDate.getHours()).padStart(2, '0');
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
    const endTime = `${endHours}:${endMinutes}`;

    const nowEpochSeconds = Math.floor(Date.now() / 1000);
    const expiresAt = nowEpochSeconds + durationMinutes * 60; // Exactly 300 seconds from now

    const reservationId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const reservation: Reservation = {
      id: reservationId,
      userId: input.userId,
      userEmail: input.userEmail,
      userName: input.userName,
      roomId: room.id,
      roomName: room.name,
      faculty: room.faculty,
      date: input.date,
      startTime: input.startTime,
      endTime,
      durationMinutes,
      status: 'ACTIVE',
      purpose: input.purpose || 'Estudio individual o investigación bibliográfica',
      attendees: input.attendees || 1,
      createdAt: new Date().toISOString(),
      expiresAt
    };

    const outboxEvent: OutboxEvent = {
      id: `evt-res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      aggregateType: 'Reservation',
      aggregateId: reservationId,
      eventType: 'reservation.created',
      payload: {
        reservationId: reservation.id,
        userId: reservation.userId,
        userEmail: reservation.userEmail,
        userName: reservation.userName,
        roomId: room.id,
        roomName: room.name,
        faculty: room.faculty,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        durationMinutes: reservation.durationMinutes,
        roomStatus: 'RESERVED',
        message: `¡Tu reserva en la ${room.name} ha sido confirmada! Cuentas con un turno asignado de 5 minutos exactos.`
      },
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    // 5. Execute ACID 3-Operation Composite Transaction (Put Reservation, Update Room, Put Outbox)
    await this.repository.createWithOutbox(
      reservation,
      { currentStatus: 'RESERVED', activeReservationId: reservation.id },
      outboxEvent
    );

    // Immediate instant publish just in case outbox interval takes a few seconds
    try {
      await this.broker.publishKafka('reservation.created', outboxEvent.payload);
      await this.broker.publishMqtt(`library/rooms/${room.id}/status`, {
        roomId: room.id,
        status: 'RESERVED',
        updatedAt: new Date().toISOString()
      });
    } catch {
      logger.warn(`⚠️ No se pudo enviar mensaje MQTT en tiempo real para sala ${room.name}, la tabla outbox lo reintentará asincrónicamente.`);
    }

    logger.info(`🎉 Reserva ${reservation.id} creada exitosamente en ${room.name} por 5 minutos.`);
    return reservation;
  }
}
