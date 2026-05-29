import { Client } from "pg";
import { User } from "../../domain/entities/User";
import { UserRepository } from "../../domain/ports/UserRepository";

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly client: Client) {}

  async save(user: User): Promise<User> {
    const query = `
      INSERT INTO users (email, password, role)
      VALUES ($1, $2, $3)
      RETURNING id, email, password, role;
    `;
    const values = [user.email, user.passwordHash, user.role];

    const result = await this.client.query(query, values);
    const row = result.rows[0];

    return new User(row.id, row.email, row.password, row.role);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await this.client.query(query, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new User(row.id, row.email, row.password, row.role);
  }

  async findById(id: number): Promise<User | null> {
    const query = "SELECT * FROM users WHERE id = $1";
    const result = await this.client.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new User(row.id, row.email, row.password, row.role);
  }
}
