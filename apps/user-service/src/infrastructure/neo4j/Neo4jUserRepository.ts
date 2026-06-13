import neo4j, { Driver } from "neo4j-driver";
import { UserRepository } from "../../domain/UserRepository";
import { User } from "../../domain/entities";
import { randomUUID } from "crypto";

export class Neo4jUserRepository implements UserRepository {
  private driver: Driver;

  constructor() {
    const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
    const user = process.env.NEO4J_USER || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "admin123";

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }

  private mapUser(record: any): User {
    const node = record.get("u");
    const rolesNode = record.has("roles") ? record.get("roles") : [];
    
    return {
      id: node.properties.id,
      email: node.properties.email,
      firstName: node.properties.firstName,
      lastName: node.properties.lastName,
      isActive: node.properties.isActive,
      createdAt: new Date(node.properties.createdAt),
      updatedAt: new Date(node.properties.updatedAt),
      roles: rolesNode.map((r: any) => ({
        id: r.properties.id,
        name: r.properties.name,
        permissions: []
      }))
    };
  }

  async createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const session = this.driver.session();
    try {
      const id = randomUUID();
      const now = new Date().toISOString();
      
      const result = await session.run(
        `
        CREATE (u:User {
          id: $id,
          email: $email,
          firstName: $firstName,
          lastName: $lastName,
          isActive: $isActive,
          createdAt: $now,
          updatedAt: $now
        })
        RETURN u
        `,
        { id, ...data, now }
      );
      
      return this.mapUser(result.records[0]);
    } finally {
      await session.close();
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (u:User {id: $id})
        OPTIONAL MATCH (u)-[:HAS_ROLE]->(r:Role)
        RETURN u, collect(r) as roles
        `,
        { id }
      );
      
      if (result.records.length === 0) return null;
      return this.mapUser(result.records[0]);
    } finally {
      await session.close();
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (u:User {email: $email})
        OPTIONAL MATCH (u)-[:HAS_ROLE]->(r:Role)
        RETURN u, collect(r) as roles
        `,
        { email }
      );
      
      if (result.records.length === 0) return null;
      return this.mapUser(result.records[0]);
    } finally {
      await session.close();
    }
  }

  async getAllUsers(): Promise<User[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (u:User)
        OPTIONAL MATCH (u)-[:HAS_ROLE]->(r:Role)
        RETURN u, collect(r) as roles
        `
      );
      
      return result.records.map((record: any) => this.mapUser(record));
    } finally {
      await session.close();
    }
  }

  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(
        `
        MATCH (u:User {id: $userId})
        MERGE (r:Role {name: $roleName})
        MERGE (u)-[:HAS_ROLE]->(r)
        `,
        { userId, roleName }
      );
    } finally {
      await session.close();
    }
  }
}
