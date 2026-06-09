import { RegisterUserUseCase } from "../src/application/use-cases/RegisterUserUseCase";
import { LoginUserUseCase } from "../src/application/use-cases/LoginUserUseCase";
import { User } from "../src/domain/entities/User";
import { UserRepository } from "../src/domain/ports/UserRepository";
import { PasswordHasher } from "../src/domain/ports/PasswordHasher";

// --- In-Memory Mocks (no external dependencies needed) ---

class MockUserRepository implements UserRepository {
  private users: User[] = [];

  async save(user: User): Promise<User> {
    const savedUser = new User(this.users.length + 1, user.email, user.passwordHash, user.role);
    this.users.push(savedUser);
    return savedUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) || null;
  }

  async findById(id: number): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  clear(): void {
    this.users = [];
  }
}

class MockPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed_${password}`;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return hash === `hashed_${password}`;
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

async function testUserEntity(): Promise<void> {
  console.log("\n📋 User Entity Tests:");

  const adminUser = new User(1, "admin@uce.edu.ec", "hash", "ADMIN");
  assert(adminUser.isAdmin() === true, "Admin user should return isAdmin = true");

  const regularUser = new User(2, "user@uce.edu.ec", "hash", "USER");
  assert(regularUser.isAdmin() === false, "Regular user should return isAdmin = false");

  assert(adminUser.email === "admin@uce.edu.ec", "User email should be set correctly");
  assert(adminUser.id === 1, "User id should be set correctly");
  assert(adminUser.role === "ADMIN", "User role should be set correctly");
}

async function testRegisterUserUseCase(): Promise<void> {
  console.log("\n📋 RegisterUserUseCase Tests:");

  const repo = new MockUserRepository();
  const hasher = new MockPasswordHasher();
  const registerUseCase = new RegisterUserUseCase(repo, hasher);

  // Test 1: Successful registration
  const result = await registerUseCase.execute("test@uce.edu.ec", "password123");
  assert(result.email === "test@uce.edu.ec", "Should register user with correct email");
  assert(result.id === 1, "Should assign an id to the registered user");
  assert(result.role === "USER", "Should default to USER role");

  // Test 2: Registration with custom role
  const adminResult = await registerUseCase.execute("admin@uce.edu.ec", "admin123", "ADMIN");
  assert(adminResult.role === "ADMIN", "Should register with custom ADMIN role");

  // Test 3: Duplicate email should throw
  await assertThrows(
    () => registerUseCase.execute("test@uce.edu.ec", "otherpassword"),
    "User with this email already exists",
    "Should throw error for duplicate email registration",
  );
}

async function testLoginUserUseCase(): Promise<void> {
  console.log("\n📋 LoginUserUseCase Tests:");

  const repo = new MockUserRepository();
  const hasher = new MockPasswordHasher();
  const registerUseCase = new RegisterUserUseCase(repo, hasher);
  const loginUseCase = new LoginUserUseCase(repo, hasher);

  // Setup: Register a user first
  await registerUseCase.execute("login@uce.edu.ec", "mypassword");

  // Test 1: Successful login
  const user = await loginUseCase.execute("login@uce.edu.ec", "mypassword");
  assert(user.email === "login@uce.edu.ec", "Should login with correct email");
  assert(user.id === 1, "Should return the correct user id");

  // Test 2: Wrong password should throw
  await assertThrows(
    () => loginUseCase.execute("login@uce.edu.ec", "wrongpassword"),
    "Invalid email or password",
    "Should throw error for wrong password",
  );

  // Test 3: Non-existent email should throw
  await assertThrows(
    () => loginUseCase.execute("nonexistent@uce.edu.ec", "anypassword"),
    "Invalid email or password",
    "Should throw error for non-existent email",
  );
}

// --- Main ---

async function main(): Promise<void> {
  console.log("🧪 Auth Service - Unit Tests\n" + "=".repeat(40));

  await testUserEntity();
  await testRegisterUserUseCase();
  await testLoginUserUseCase();

  console.log("\n" + "=".repeat(40));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
