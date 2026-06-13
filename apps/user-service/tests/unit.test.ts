import { UserUseCases } from "../src/application/UserUseCases";
import { UserRepository } from "../src/domain/UserRepository";
import { User } from "../src/domain/entities";

// --- In-Memory Mocks (no external dependencies needed) ---

class MockUserRepository implements UserRepository {
  private users: User[] = [];

  async createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const newUser: User = {
      ...data,
      id: `mock-id-${this.users.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: []
    };
    this.users.push(newUser);
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) || null;
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.roles.push({ id: `role-${roleName}`, name: roleName, permissions: [] });
    }
  }

  clear(): void {
    this.users = [];
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

async function assertThrows(fn: () => Promise<unknown>, expectedMessage: string, testName: string): Promise<void> {
  try {
    await fn();
    console.error(`  ❌ ${testName} (expected error but none was thrown)`);
    failed++;
  } catch (error: any) {
    if (error.message === expectedMessage) {
      console.log(`  ✅ ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ ${testName} (expected: "${expectedMessage}", got: "${error.message}")`);
      failed++;
    }
  }
}

// --- Tests ---

async function testUserUseCases(): Promise<void> {
  console.log("\n📋 UserUseCases Tests:");

  const repo = new MockUserRepository();
  const userUseCases = new UserUseCases(repo);

  // Test 1: Successful creation
  const result = await userUseCases.createUser({
    email: "test@uce.edu.ec",
    firstName: "Test",
    lastName: "User",
    isActive: true,
    roles: []
  });
  
  assert(result.email === "test@uce.edu.ec", "Should register user with correct email");
  assert(result.id === "mock-id-1", "Should assign an id to the user");

  // Test 2: Duplicate email should throw
  await assertThrows(
    () => userUseCases.createUser({
      email: "test@uce.edu.ec",
      firstName: "Duplicate",
      lastName: "User",
      isActive: true,
      roles: []
    }),
    "User already exists with this email",
    "Should throw error for duplicate email",
  );

  // Test 3: Assign role
  await userUseCases.assignRole(result.id, "ADMIN");
  const updatedUser = await userUseCases.getUserById(result.id);
  assert(updatedUser?.roles.some(r => r.name === "ADMIN") === true, "Should successfully assign ADMIN role");
}

// --- Main ---

async function main(): Promise<void> {
  console.log("🧪 User Service - Unit Tests\n" + "=".repeat(40));

  await testUserUseCases();

  console.log("\n" + "=".repeat(40));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
