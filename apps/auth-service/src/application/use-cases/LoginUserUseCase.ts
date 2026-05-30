import { User } from "../../domain/entities/User";
import { UserRepository } from "../../domain/ports/UserRepository";
import { PasswordHasher } from "../../domain/ports/PasswordHasher";

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  public async execute(email: string, plainPassword: string): Promise<User> {
    // 1. Find the user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // 2. Verify password
    const isPasswordValid = await this.passwordHasher.compare(
      plainPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // 3. Return validated user
    return user;
  }
}
