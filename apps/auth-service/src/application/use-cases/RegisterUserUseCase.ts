import { User } from "../../domain/entities/User";
import { UserRepository } from "../../domain/ports/UserRepository";
import { PasswordHasher } from "../../domain/ports/PasswordHasher";
import { kafkaProducer } from "../../infrastructure/kafka/Producer";

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  public async execute(
    email: string,
    plainPassword: string,
    role: string = "USER",
  ): Promise<Omit<User, "passwordHash">> {
    // 1. Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // 2. Hash the password
    const hashedPassword = await this.passwordHasher.hash(plainPassword);

    // 3. Create the Domain Entity
    const newUser = new User(null, email, hashedPassword, role);

    // 4. Save using the Port (Interface)
    const savedUser = await this.userRepository.save(newUser);

    // 5. Emit user.registered event to Kafka
    await kafkaProducer.publish("auth-events", {
      event: "user.registered",
      payload: {
        id: savedUser.id?.toString(),
        email: savedUser.email,
        role: savedUser.role,
        firstName: "",
        lastName: "",
        isActive: true
      }
    });

    // 6. Return user data securely (without password)
    return {
      id: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
      isAdmin: savedUser.isAdmin,
    };
  }
}
