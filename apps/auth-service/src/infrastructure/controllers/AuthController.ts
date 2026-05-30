import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { RegisterUserUseCase } from "../../application/use-cases/RegisterUserUseCase";
import { LoginUserUseCase } from "../../application/use-cases/LoginUserUseCase";

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUserUseCase,
  ) {}

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, role } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const user = await this.registerUseCase.execute(email, password, role);
      res.status(201).json({ message: "User registered successfully", user });
    } catch (error: any) {
      if (error.message === "User with this email already exists") {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const user = await this.loginUseCase.execute(email, password);

      // Generate JWT Token
      const secret = process.env.JWT_SECRET || "fallback_secret";
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        secret,
        { expiresIn: "24h" },
      );

      res.status(200).json({
        message: "Login successful",
        token,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (error: any) {
      if (error.message === "Invalid email or password") {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };
}
