import { User, Role } from "./entities";

export interface UserRepository {
  createUser(user: Omit<User, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<Omit<User, "id" | "createdAt" | "updatedAt" | "roles">>): Promise<User | null>;
  assignRoleToUser(userId: string, roleName: string): Promise<void>;
  removeRoleFromUser(userId: string, roleName: string): Promise<void>;
}
