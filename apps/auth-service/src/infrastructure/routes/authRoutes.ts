import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { RegisterUserUseCase } from "../../application/use-cases/RegisterUserUseCase";
import { LoginUserUseCase } from "../../application/use-cases/LoginUserUseCase";
import { PostgresUserRepository } from "../adapters/PostgresUserRepository";
import { BcryptPasswordHasher } from "../adapters/BcryptPasswordHasher";
import { Client } from "pg";

export const createAuthRouter = (pgClient: Client): Router => {
  const router = Router();

  // 1. Instantiate the Adapters (Infrastructure)
  const userRepository = new PostgresUserRepository(pgClient);
  const passwordHasher = new BcryptPasswordHasher();

  // 2. Instantiate the Use Cases (Application) by injecting the adapters
  const registerUseCase = new RegisterUserUseCase(
    userRepository,
    passwordHasher,
  );
  const loginUseCase = new LoginUserUseCase(userRepository, passwordHasher);

  // 3. Instantiate the Controller by injecting the use cases
  const authController = new AuthController(registerUseCase, loginUseCase);

  // 4. Define the REST routes
  
  /**
   * @swagger
   * /register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               role:
   *                 type: string
   *     responses:
   *       201:
   *         description: User created successfully
   */
  router.post("/register", authController.register);

  /**
   * @swagger
   * /login:
   *   post:
   *     summary: Login user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   */
  router.post("/login", authController.login);

  return router;
};
