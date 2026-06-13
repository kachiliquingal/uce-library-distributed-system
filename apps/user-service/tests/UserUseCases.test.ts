import { UserUseCases } from "../src/application/UserUseCases";
import { UserRepository } from "../src/domain/UserRepository";
import { User } from "../src/domain/entities";

// Mock implementation of UserRepository
class MockUserRepository implements UserRepository {
  private users: User[] = [];

  async createUser(data: Omit<User, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<User> {
    const newUser: User = {
      ...data,
      id: data.id || "mock-id-123",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async updateUser(id: string, data: Partial<Omit<User, "id" | "createdAt" | "updatedAt" | "roles">>): Promise<User | null> {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;
    Object.assign(user, data);
    return user;
  }

  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.roles.push({ id: "role-1", name: roleName, permissions: [] });
    }
  }

  async removeRoleFromUser(userId: string, roleName: string): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.roles = user.roles.filter(r => r.name !== roleName);
    }
  }
}

describe("UserUseCases", () => {
  let userRepository: UserRepository;
  let userUseCases: UserUseCases;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    userUseCases = new UserUseCases(userRepository);
  });

  it("should create a new user successfully", async () => {
    const userData = {
      email: "test@test.com",
      firstName: "John",
      lastName: "Doe",
      isActive: true,
      roles: []
    };

    const user = await userUseCases.createUser(userData);

    expect(user).toBeDefined();
    expect(user.id).toBe("mock-id-123");
    expect(user.email).toBe("test@test.com");
  });

  it("should throw an error if email already exists", async () => {
    const userData = {
      email: "duplicate@test.com",
      firstName: "Jane",
      lastName: "Doe",
      isActive: true,
      roles: []
    };

    await userUseCases.createUser(userData);

    // Try creating the same email again
    await expect(userUseCases.createUser(userData)).rejects.toThrow("User already exists with this email");
  });

  it("should assign a role to an existing user", async () => {
    const userData = {
      email: "admin@test.com",
      firstName: "Admin",
      lastName: "User",
      isActive: true,
      roles: []
    };

    const user = await userUseCases.createUser(userData);
    await userUseCases.assignRole(user.id, "ADMIN");

    const updatedUser = await userUseCases.getUserById(user.id);
    expect(updatedUser?.roles.some(r => r.name === "ADMIN")).toBe(true);
  });
});
