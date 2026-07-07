import { UserUseCases } from "../src/application/UserUseCases";
import { UserRepository } from "../src/domain/UserRepository";
import { User } from "../src/domain/entities";

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

  async createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const newUser: User = {
      ...data,
      id: "mock-id-" + (this.users.length + 1),
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
      user.roles.push({ id: "role-" + roleName, name: roleName, permissions: [] });
    }
  }
  clear(): void {
    this.users = [];
  }
}

describe("User Service Unit Tests", () => {
  test("UserUseCases Tests", async () => {
    const repo = new MockUserRepository();
    const userUseCases = new UserUseCases(repo);

    const result = await userUseCases.createUser({
      email: "test@uce.edu.ec",
      firstName: "Test",
      lastName: "User",
      isActive: true,
      roles: []
    });

    expect(result.email).toBe("test@uce.edu.ec");
    expect(result.id).toBe("mock-id-1");

    await expect(userUseCases.createUser({
      email: "test@uce.edu.ec",
      firstName: "Duplicate",
      lastName: "User",
      isActive: true,
      roles: []
    })).rejects.toThrow("User already exists with this email");

    await userUseCases.assignRole(result.id, "ADMIN");
    const updatedUser = await userUseCases.getUserById(result.id);
    expect(updatedUser?.roles.some(r => r.name === "ADMIN")).toBe(true);
  });
});
