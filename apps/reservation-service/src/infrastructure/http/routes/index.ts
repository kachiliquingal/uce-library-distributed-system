import { Router } from 'express';
import { ReservationController } from '../controllers/ReservationController';

export const createRoutes = (controller: ReservationController): Router => {
  const router = Router();

  /**
   * @openapi
   * /rooms:
   *   get:
   *     summary: Obtener catálogo de 42 salas de estudio universitarias y su estado en tiempo real
   *     tags: [Study Rooms]
   *     parameters:
   *       - in: query
   *         name: faculty
   *         schema:
   *           type: string
   *         description: Filtrar por facultad
   *     responses:
   *       200:
   *         description: Lista de salas con estado AVAILABLE u OCCUPIED/RESERVED
   */
  router.get('/rooms', controller.getRooms);

  /**
   * @openapi
   * /rooms/available:
   *   get:
   *     summary: Obtener salas disponibles por fecha
   *     tags: [Study Rooms]
   *     responses:
   *       200:
   *         description: Lista de salas disponibles
   */
  router.get('/rooms/available', controller.getRooms);

  /**
   * @openapi
   * /:
   *   post:
   *     summary: Crear reserva con turno asignado de 5 minutos (Transacción ACID de 3 operaciones + Patrón Outbox)
   *     tags: [Reservations]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [userId, roomId, date, startTime]
   *             properties:
   *               userId:
   *                 type: string
   *               userEmail:
   *                 type: string
   *               userName:
   *                 type: string
   *               roomId:
   *                 type: string
   *               date:
   *                 type: string
   *                 example: "2026-07-05"
   *               startTime:
   *                 type: string
   *                 example: "14:00"
   *     responses:
   *       201:
   *         description: Reserva creada exitosamente y sala ocupada
   *       400:
   *         description: Regla de negocio violada (ej. fecha fuera de Hoy/Mañana o usuario ya tiene reserva activa)
   */
  router.post('/', controller.createReservation);

  /**
   * @openapi
   * /:
   *   get:
   *     summary: Listar reservas por usuario o sala
   *     tags: [Reservations]
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *       - in: query
   *         name: roomId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Lista de reservas
   */
  router.get('/', controller.getReservations);

  /**
   * @openapi
   * /{id}:
   *   delete:
   *     summary: Cancelar una reserva activa y liberar la sala en tiempo real vía MQTT
   *     tags: [Reservations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Reserva cancelada y sala liberada
   */
  router.delete('/:id', controller.cancelReservation);

  return router;
};
