import { CreateNotificationUseCase } from '../src/application/use-cases/CreateNotificationUseCase';
import { GetNotificationsUseCase } from '../src/application/use-cases/GetNotificationsUseCase';
import { NotificationRepository } from '../src/domain/repositories/NotificationRepository';
import { Notification } from '../src/domain/entities/Notification';

class MockNotificationRepository implements NotificationRepository {
  private notifications: Notification[] = [];

  async save(notification: Notification): Promise<void> {
    this.notifications.push(notification);
  }
  async findByUserId(userId: string): Promise<Notification[]> {
    return this.notifications.filter(n => n.userId === userId);
  }
  async findAll(): Promise<Notification[]> {
    return this.notifications;
  }
  async updateStatus(id: string, status: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.status = status as any;
    }
  }
}

describe("Notification Service Unit Tests", () => {
  test("Notification Use Cases Tests", async () => {
    const repository = new MockNotificationRepository();
    const createUseCase = new CreateNotificationUseCase(repository);
    const getUseCase = new GetNotificationsUseCase(repository);

    await createUseCase.execute('user123', 'EMAIL', 'Test Subject', 'Test Body');

    const notifications = await getUseCase.executeByUserId('user123');
    expect(notifications.length).toBe(1);
    expect(notifications[0].subject).toBe('Test Subject');
    expect(notifications[0].status).toBe('SENT');

    await createUseCase.execute('user2', 'PUSH', 'S2', 'B2');

    const all = await getUseCase.executeAll();
    expect(all.length).toBe(2);
  });
});
