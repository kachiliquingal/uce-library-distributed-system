import { RegisterUserUseCase } from "../src/application/use-cases/RegisterUserUseCase";
import { LoginUserUseCase } from "../src/application/use-cases/LoginUserUseCase";
import { User } from "../src/domain/entities/User";
import { UserRepository } from "../src/domain/ports/UserRepository";
import { PasswordHasher } from "../src/domain/ports/PasswordHasher";

jest.mock("../src/infrastructure/kafka/KafkaProducer", () => ({
  KafkaProducer: {
    getInstance: jest.fn().mockReturnValue({
      emitEvent: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

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
    return "hashed_" + password;
  }
  async compare(password: string, hash: string): Promise<boolean> {
    return hash === "hashed_" + password;
  }
}

describe("Auth Service Unit Tests", () => {
  test("User Entity Tests", () => {
    const adminUser = new User(1, "admin@uce.edu.ec", "hash", "ADMIN");
    expect(adminUser.isAdmin()).toBe(true);
    const regularUser = new User(2, "user@uce.edu.ec", "hash", "USER");
    expect(regularUser.isAdmin()).toBe(false);
    expect(adminUser.email).toBe("admin@uce.edu.ec");
    expect(adminUser.id).toBe(1);
    expect(adminUser.role).toBe("ADMIN");
  });

  test("RegisterUserUseCase Tests", async () => {
    const repo = new MockUserRepository();
    const hasher = new MockPasswordHasher();
    const registerUseCase = new RegisterUserUseCase(repo, hasher);

    const result = await registerUseCase.execute("test@uce.edu.ec", "password123");
    expect(result.email).toBe("test@uce.edu.ec");
    expect(result.id).toBe(1);
    expect(result.role).toBe("USER");

    const adminResult = await registerUseCase.execute("admin@uce.edu.ec", "admin123", "ADMIN");
    expect(adminResult.role).toBe("ADMIN");

    await expect(registerUseCase.execute("test@uce.edu.ec", "otherpassword")).rejects.toThrow("User with this email already exists");
  });

  test("LoginUserUseCase Tests", async () => {
    const repo = new MockUserRepository();
    const hasher = new MockPasswordHasher();
    const registerUseCase = new RegisterUserUseCase(repo, hasher);
    const loginUseCase = new LoginUserUseCase(repo, hasher);

    await registerUseCase.execute("login@uce.edu.ec", "mypassword");

    const user = await loginUseCase.execute("login@uce.edu.ec", "mypassword");
    expect(user.email).toBe("login@uce.edu.ec");
    expect(user.id).toBe(1);

    await expect(loginUseCase.execute("login@uce.edu.ec", "wrongpassword")).rejects.toThrow("Invalid email or password");
    await expect(loginUseCase.execute("nonexistent@uce.edu.ec", "anypassword")).rejects.toThrow("Invalid email or password");
  });
});
