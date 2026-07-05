import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { IReservationRepository } from '../../domain/IReservationRepository';
import { Reservation, ReservationStatus } from '../../domain/Reservation';
import { StudyRoom, INITIAL_STUDY_ROOMS } from '../../domain/StudyRoom';
import { OutboxEvent } from '../../domain/OutboxEvent';
import { logger } from '../../utils/logger';

export class DynamoDBAdapter implements IReservationRepository {
  private client!: DynamoDBClient;
  private docClient!: DynamoDBDocumentClient;
  private tableName = process.env.DYNAMODB_TABLE_NAME || 'Reservations';
  private useMemoryFallback = false;

  // Memory Fallback Storage
  private memoryReservations: Map<string, Reservation> = new Map();
  private memoryRooms: Map<string, StudyRoom> = new Map();
  private memoryOutbox: Map<string, OutboxEvent> = new Map();

  constructor() {
    this.initRooms();
    this.initDynamoDB();
  }

  private initRooms() {
    INITIAL_STUDY_ROOMS.forEach(room => {
      this.memoryRooms.set(room.id, { ...room });
    });
  }

  private async initDynamoDB() {
    try {
      const region = process.env.DYNAMODB_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
      const endpoint = process.env.DYNAMODB_ENDPOINT; // For local/testing if provided

      this.client = new DynamoDBClient({
        region,
        endpoint: endpoint ? endpoint : undefined,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
          sessionToken: process.env.AWS_SESSION_TOKEN
        }
      });

      this.docClient = DynamoDBDocumentClient.from(this.client, {
        marshallOptions: { removeUndefinedValues: true }
      });

      await this.ensureTableExists();
      await this.seedRoomsToDynamoDB();
      logger.info('✅ Conectado exitosamente a AWS DynamoDB y tabla verificada');
    } catch (error) {
      logger.warn('⚠️ No se pudo conectar a AWS DynamoDB o credenciales ausentes. Activando MemoryFallbackAdapter de alta resiliencia.', { error: (error as Error).message });
      this.useMemoryFallback = true;
    }
  }

  private async ensureTableExists() {
    try {
      await this.client.send(new DescribeTableCommand({ TableName: this.tableName }));
    } catch (err: unknown) {
      const error = err as { name?: string; __type?: string };
      if (error.name === 'ResourceNotFoundException' || error.__type?.includes('ResourceNotFoundException')) {
        logger.info(`📦 Tabla ${this.tableName} no existe en DynamoDB. Creando automáticamente...`);
        await this.client.send(new CreateTableCommand({
          TableName: this.tableName,
          KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'SK', KeyType: 'RANGE' }
          ],
          AttributeDefinitions: [
            { AttributeName: 'PK', AttributeType: 'S' },
            { AttributeName: 'SK', AttributeType: 'S' }
          ],
          BillingMode: 'PAY_PER_REQUEST'
        }));
        logger.info(`✅ Tabla ${this.tableName} creada exitosamente en DynamoDB`);
      } else {
        throw err;
      }
    }
  }

  private async seedRoomsToDynamoDB() {
    if (this.useMemoryFallback) return;
    try {
      // Check if room-F1-1 exists
      const res = await this.docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: { PK: 'ROOM#room-F1-1', SK: 'METADATA' }
      }));
      if (!res.Item) {
        logger.info('🌱 Sembrando las 42 salas de estudio universitarias en DynamoDB...');
        for (const room of INITIAL_STUDY_ROOMS) {
          await this.docClient.send(new PutCommand({
            TableName: this.tableName,
            Item: {
              PK: `ROOM#${room.id}`,
              SK: 'METADATA',
              ...room
            }
          }));
        }
        logger.info('✅ 42 salas de estudio sembradas en DynamoDB');
      }
    } catch (err) {
      logger.warn('⚠️ Error sembrando salas en DynamoDB, usando memoria temporal para salas', { error: (err as Error).message });
    }
  }

  // ==========================================
  // ACID 3-OPERATION COMPOSITE TRANSACTION
  // ==========================================
  async createWithOutbox(reservation: Reservation, roomUpdate: Partial<StudyRoom>, outboxEvent: OutboxEvent): Promise<void> {
    if (this.useMemoryFallback) {
      // Memory atomic execution
      const room = this.memoryRooms.get(reservation.roomId);
      if (!room || room.currentStatus !== 'AVAILABLE') {
        throw new Error('La sala seleccionada ya no está disponible en este momento.');
      }
      this.memoryReservations.set(reservation.id, reservation);
      this.memoryRooms.set(reservation.roomId, { ...room, ...roomUpdate, currentStatus: 'RESERVED', activeReservationId: reservation.id });
      this.memoryOutbox.set(outboxEvent.id, outboxEvent);
      logger.info(`✅ [Memory ACID 3-Ops] Reserva ${reservation.id} creada, Sala ${reservation.roomId} reservada y Evento Outbox ${outboxEvent.id} registrado`);
      return;
    }

    try {
      // 3 Operations in 1 Atomic DynamoDB Transaction (Put Reservation, Update Room, Put Outbox)
      const command = new TransactWriteCommand({
        TransactItems: [
          // Operation 1: Put Reservation
          {
            Put: {
              TableName: this.tableName,
              Item: {
                PK: `RESERVATION#${reservation.id}`,
                SK: `USER#${reservation.userId}`,
                ...reservation
              },
              ConditionExpression: 'attribute_not_exists(PK)'
            }
          },
          // Operation 2: Update Room Status with Optimistic Concurrency / ACID Check
          {
            Update: {
              TableName: this.tableName,
              Key: { PK: `ROOM#${reservation.roomId}`, SK: 'METADATA' },
              UpdateExpression: 'SET currentStatus = :status, activeReservationId = :resId',
              ConditionExpression: 'currentStatus = :avail OR attribute_not_exists(PK)',
              ExpressionAttributeValues: {
                ':status': 'RESERVED',
                ':resId': reservation.id,
                ':avail': 'AVAILABLE'
              }
            }
          },
          // Operation 3: Put Outbox Event
          {
            Put: {
              TableName: this.tableName,
              Item: {
                PK: `OUTBOX#${outboxEvent.id}`,
                SK: `STATUS#${outboxEvent.status}`,
                ...outboxEvent
              }
            }
          }
        ]
      });

      await this.docClient.send(command);
      // Update local memory sync
      const room = this.memoryRooms.get(reservation.roomId);
      if (room) this.memoryRooms.set(reservation.roomId, { ...room, ...roomUpdate, currentStatus: 'RESERVED', activeReservationId: reservation.id });
      logger.info(`✅ [DynamoDB ACID 3-Ops] Reserva ${reservation.id} creada, Sala ${reservation.roomId} reservada y Evento Outbox registrado exitosamente`);
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      logger.error('❌ Error en Transacción ACID de 3 operaciones en DynamoDB (Rollback automático ejecutado):', err);
      if (err.name === 'TransactionCanceledException' || err.message?.includes('ConditionalCheckFailed')) {
        throw new Error('La sala seleccionada acaba de ser ocupada o hubo un conflicto de concurrencia ACID.', { cause: error });
      }
      // If network fail, try memory fallback
      this.useMemoryFallback = true;
      return this.createWithOutbox(reservation, roomUpdate, outboxEvent);
    }
  }

  // ==========================================
  // ACID 3-OPERATION CANCELLATION / EXPIRATION
  // ==========================================
  async updateStatusWithOutbox(
    reservationId: string,
    newStatus: ReservationStatus,
    roomId: string,
    roomStatus: StudyRoom['currentStatus'],
    outboxEvent: OutboxEvent
  ): Promise<void> {
    if (this.useMemoryFallback) {
      const res = this.memoryReservations.get(reservationId);
      if (res) this.memoryReservations.set(reservationId, { ...res, status: newStatus });
      const room = this.memoryRooms.get(roomId);
      if (room) this.memoryRooms.set(roomId, { ...room, currentStatus: roomStatus, activeReservationId: undefined });
      this.memoryOutbox.set(outboxEvent.id, outboxEvent);
      logger.info(`✅ [Memory ACID 3-Ops] Reserva ${reservationId} cambiada a ${newStatus}, Sala ${roomId} liberada y Evento Outbox registrado`);
      return;
    }

    try {
      const res = await this.findById(reservationId);
      if (!res) throw new Error(`Reserva ${reservationId} no encontrada`);

      const command = new TransactWriteCommand({
        TransactItems: [
          // Operation 1: Update Reservation Status
          {
            Update: {
              TableName: this.tableName,
              Key: { PK: `RESERVATION#${reservationId}`, SK: `USER#${res.userId}` },
              UpdateExpression: 'SET #st = :newStatus',
              ExpressionAttributeNames: { '#st': 'status' },
              ExpressionAttributeValues: { ':newStatus': newStatus }
            }
          },
          // Operation 2: Update Room Status back to AVAILABLE
          {
            Update: {
              TableName: this.tableName,
              Key: { PK: `ROOM#${roomId}`, SK: 'METADATA' },
              UpdateExpression: 'SET currentStatus = :roomStatus REMOVE activeReservationId',
              ExpressionAttributeValues: { ':roomStatus': roomStatus }
            }
          },
          // Operation 3: Put Outbox Event
          {
            Put: {
              TableName: this.tableName,
              Item: {
                PK: `OUTBOX#${outboxEvent.id}`,
                SK: `STATUS#${outboxEvent.status}`,
                ...outboxEvent
              }
            }
          }
        ]
      });

      await this.docClient.send(command);
      const room = this.memoryRooms.get(roomId);
      if (room) this.memoryRooms.set(roomId, { ...room, currentStatus: roomStatus, activeReservationId: undefined });
      logger.info(`✅ [DynamoDB ACID 3-Ops] Reserva ${reservationId} finalizada/cancelada (${newStatus}), Sala ${roomId} disponible`);
    } catch (error) {
      logger.error(`❌ Error en Transacción ACID al actualizar reserva ${reservationId}:`, error);
      this.useMemoryFallback = true;
      return this.updateStatusWithOutbox(reservationId, newStatus, roomId, roomStatus, outboxEvent);
    }
  }

  async findById(id: string): Promise<Reservation | null> {
    if (this.useMemoryFallback) {
      return this.memoryReservations.get(id) || null;
    }
    try {
      // Scan or query if we know userId, or scan by PK prefix
      const res = await this.docClient.send(new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': `RESERVATION#${id}` }
      }));
      return (res.Items?.[0] as Reservation) || null;
    } catch {
      this.useMemoryFallback = true;
      return this.findById(id);
    }
  }

  async findByUser(userId: string): Promise<Reservation[]> {
    if (this.useMemoryFallback) {
      return Array.from(this.memoryReservations.values()).filter(r => r.userId === userId);
    }
    try {
      const res = await this.docClient.send(new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId }
      }));
      return (res.Items as Reservation[]) || [];
    } catch {
      this.useMemoryFallback = true;
      return this.findByUser(userId);
    }
  }

  async findActiveByUser(userId: string): Promise<Reservation[]> {
    const all = await this.findByUser(userId);
    return all.filter(r => r.status === 'ACTIVE');
  }

  async findByRoomAndDate(roomId: string, date: string): Promise<Reservation[]> {
    if (this.useMemoryFallback) {
      return Array.from(this.memoryReservations.values()).filter(r => r.roomId === roomId && r.date === date && r.status === 'ACTIVE');
    }
    try {
      const res = await this.docClient.send(new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'roomId = :rid AND #dt = :dt AND #st = :st',
        ExpressionAttributeNames: { '#dt': 'date', '#st': 'status' },
        ExpressionAttributeValues: { ':rid': roomId, ':dt': date, ':st': 'ACTIVE' }
      }));
      return (res.Items as Reservation[]) || [];
    } catch {
      this.useMemoryFallback = true;
      return this.findByRoomAndDate(roomId, date);
    }
  }

  async findAll(): Promise<Reservation[]> {
    if (this.useMemoryFallback) {
      return Array.from(this.memoryReservations.values());
    }
    try {
      const res = await this.docClient.send(new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'begins_with(PK, :prefix)',
        ExpressionAttributeValues: { ':prefix': 'RESERVATION#' }
      }));
      return (res.Items as Reservation[]) || [];
    } catch {
      this.useMemoryFallback = true;
      return this.findAll();
    }
  }

  async findActiveExpired(currentEpochSeconds: number): Promise<Reservation[]> {
    if (this.useMemoryFallback) {
      return Array.from(this.memoryReservations.values()).filter(r => 
        r.status === 'ACTIVE' && r.expiresAt && r.expiresAt <= currentEpochSeconds
      );
    }
    try {
      const res = await this.docClient.send(new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'begins_with(PK, :prefix) AND #st = :st AND expiresAt <= :now',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: { ':prefix': 'RESERVATION#', ':st': 'ACTIVE', ':now': currentEpochSeconds }
      }));
      return (res.Items as Reservation[]) || [];
    } catch {
      this.useMemoryFallback = true;
      return this.findActiveExpired(currentEpochSeconds);
    }
  }

  async getRooms(): Promise<StudyRoom[]> {
    if (this.useMemoryFallback) {
      return Array.from(this.memoryRooms.values());
    }
    try {
      const res = await this.docClient.send(new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'begins_with(PK, :prefix)',
        ExpressionAttributeValues: { ':prefix': 'ROOM#' }
      }));
      if (!res.Items || res.Items.length === 0) {
        return Array.from(this.memoryRooms.values());
      }
      return (res.Items as StudyRoom[]);
    } catch {
      this.useMemoryFallback = true;
      return this.getRooms();
    }
  }

  async getRoomById(id: string): Promise<StudyRoom | null> {
    const rooms = await this.getRooms();
    return rooms.find(r => r.id === id) || null;
  }

  async updateRoomStatus(roomId: string, status: StudyRoom['currentStatus'], activeReservationId?: string): Promise<void> {
    const room = this.memoryRooms.get(roomId);
    if (room) this.memoryRooms.set(roomId, { ...room, currentStatus: status, activeReservationId });
    if (this.useMemoryFallback) return;
    try {
      await this.docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `ROOM#${roomId}`,
          SK: 'METADATA',
          ...room,
          currentStatus: status,
          activeReservationId
        }
      }));
    } catch {
      this.useMemoryFallback = true;
    }
  }

  async getPendingOutboxEvents(): Promise<OutboxEvent[]> {
    if (this.useMemoryFallback) {
      return Array.from(this.memoryOutbox.values()).filter(e => e.status === 'PENDING');
    }
    try {
      const res = await this.docClient.send(new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'begins_with(PK, :prefix) AND #st = :st',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: { ':prefix': 'OUTBOX#', ':st': 'PENDING' }
      }));
      return (res.Items as OutboxEvent[]) || [];
    } catch {
      this.useMemoryFallback = true;
      return this.getPendingOutboxEvents();
    }
  }

  async markOutboxPublished(eventId: string): Promise<void> {
    const event = this.memoryOutbox.get(eventId);
    if (event) this.memoryOutbox.set(eventId, { ...event, status: 'PUBLISHED', publishedAt: new Date().toISOString() });
    if (this.useMemoryFallback) return;
    try {
      await this.docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `OUTBOX#${eventId}`,
          SK: 'STATUS#PUBLISHED',
          ...event,
          status: 'PUBLISHED',
          publishedAt: new Date().toISOString()
        }
      }));
    } catch {
      this.useMemoryFallback = true;
    }
  }
}
