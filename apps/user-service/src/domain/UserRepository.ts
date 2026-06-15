import { User } from "./entities";

export interface UserRepository {
  createUser(user: Omit<User, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  assignRoleToUser(userId: string, roleName: string): Promise<void>;
}
