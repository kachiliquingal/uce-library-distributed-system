import { User } from "../domain/entities";
import { UserRepository } from "../domain/UserRepository";

export class UserUseCases {
  constructor(private userRepository: UserRepository) {}

  async createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const existingUser = await this.userRepository.getUserByEmail(data.email);
    if (existingUser) {
      throw new Error("User already exists with this email");
    }
    return this.userRepository.createUser(data);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.getUserById(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.getAllUsers();
  }

  async assignRole(userId: string, roleName: string): Promise<void> {
    if (roleName !== "USER" && roleName !== "ADMIN") {
      throw new Error("Invalid role. Must be USER or ADMIN");
    }

    const user = await this.userRepository.getUserById(userId);
    if (!user) throw new Error("User not found");
    await this.userRepository.assignRoleToUser(userId, roleName);
    
    // Emit event to Kafka
    await import("../infrastructure/kafka/KafkaProducer").then((m) =>
      m.KafkaProducer.getInstance().emitEvent("user.updated", "UserRoleUpdated", {
        userId,
        newRole: roleName
      })
    );
  }

  async getPermissions(userId: string): Promise<string[]> {
    const user = await this.userRepository.getUserById(userId);
    if (!user) throw new Error("User not found");
    
    // Collect all unique permissions from user roles
    const permissions = new Set<string>();
    user.roles.forEach(role => {
      role.permissions?.forEach(p => permissions.add(p));
    });
    
    return Array.from(permissions);
  }
}
