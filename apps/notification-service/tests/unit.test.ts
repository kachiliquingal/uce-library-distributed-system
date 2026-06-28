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

// --- Test Runner ---

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

// --- Tests ---

async function testNotificationUseCases(): Promise<void> {
  console.log("\n📋 Notification Use Cases Tests:");

  const repository = new MockNotificationRepository();
  const createUseCase = new CreateNotificationUseCase(repository);
  const getUseCase = new GetNotificationsUseCase(repository);

  await createUseCase.execute('user123', 'EMAIL', 'Test Subject', 'Test Body');
  
  const notifications = await getUseCase.executeByUserId('user123');
  assert(notifications.length === 1, "Should create and find 1 notification for user");
  assert(notifications[0].subject === 'Test Subject', "Subject should match");
  assert(notifications[0].status === 'SENT', "Status should be SENT");

  await createUseCase.execute('user2', 'PUSH', 'S2', 'B2');
  
  const all = await getUseCase.executeAll();
  assert(all.length === 2, "Should retrieve all notifications (2)");
}

// --- Main ---

async function main(): Promise<void> {
  console.log("🧪 Notification Service - Unit Tests\n" + "=".repeat(40));

  await testNotificationUseCases();

  console.log("\n" + "=".repeat(40));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
