import { Request, Response } from 'express';
import { CreateReservationWithOutboxUseCase } from '../../../application/use-cases/CreateReservationWithOutboxUseCase';
import { GetReservationsUseCase } from '../../../application/use-cases/GetReservationsUseCase';
import { CancelReservationUseCase } from '../../../application/use-cases/CancelReservationUseCase';
import { GetRoomsAvailabilityUseCase } from '../../../application/use-cases/GetRoomsAvailabilityUseCase';
import { logger } from '../../../utils/logger';

export class ReservationController {
  constructor(
    private createUseCase: CreateReservationWithOutboxUseCase,
    private getReservationsUseCase: GetReservationsUseCase,
    private cancelUseCase: CancelReservationUseCase,
    private getRoomsUseCase: GetRoomsAvailabilityUseCase
  ) {}

  createReservation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, userEmail, userName, roomId, date, startTime, purpose, attendees } = req.body;
      if (!userId || !roomId || !date || !startTime) {
        res.status(400).json({ error: 'Faltan parámetros obligatorios: userId, roomId, date, startTime' });
        return;
      }
      const reservation = await this.createUseCase.execute({
        userId,
        userEmail: userEmail || `${userId}@uce.edu.ec`,
        userName: userName || 'Estudiante UCE',
        roomId,
        date,
        startTime,
        purpose,
        attendees: Number(attendees) || 1
      });
      res.status(201).json(reservation);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No se pudo crear la reserva';
      logger.warn('Error al crear reserva:', { error: msg });
      res.status(400).json({ error: msg });
    }
  };

  getReservations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, roomId, date } = req.query;
      const list = await this.getReservationsUseCase.execute({
        userId: userId as string,
        roomId: roomId as string,
        date: date as string
      });
      res.status(200).json(list);
    } catch (error) {
      logger.error('Error al consultar reservas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  cancelReservation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId, isAdmin } = req.body;
      await this.cancelUseCase.execute(id, userId || 'admin', Boolean(isAdmin));
      res.status(200).json({ message: 'Reserva cancelada y sala liberada exitosamente' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al cancelar reserva';
      logger.warn(`Error al cancelar reserva ${req.params.id}:`, { error: msg });
      res.status(400).json({ error: msg });
    }
  };

  getRooms = async (req: Request, res: Response): Promise<void> => {
    try {
      const { date, faculty } = req.query;
      const rooms = await this.getRoomsUseCase.execute(date as string, faculty as string);
      res.status(200).json(rooms);
    } catch (error) {
      logger.error('Error al consultar salas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}
