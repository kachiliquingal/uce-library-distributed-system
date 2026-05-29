export class User {
  constructor(
    public readonly id: number | null,
    public readonly email: string,
    public passwordHash: string,
    public readonly role: string,
  ) {}

  // Business rule: Check if user is admin
  public isAdmin(): boolean {
    return this.role === "ADMIN";
  }
}
