import { Request, Response } from "express";
import { UserUseCases } from "../../../application/UserUseCases";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         isActive:
 *           type: boolean
 *         roles:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 */

export class UserController {
  constructor(private userUseCases: UserUseCases) {}

  /**
   * @swagger
   * /users:
   *   post:
   *     summary: Create a new user
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/User'
   *     responses:
   *       201:
   *         description: User created
   *       400:
   *         description: Error creating user
   */
  async createUser(req: Request, res: Response) {
    try {
      const user = await this.userUseCases.createUser(req.body);
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     summary: Get a user by ID
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: The user ID
   *     responses:
   *       200:
   *         description: User found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         description: User not found
   */
  async getUserById(req: Request, res: Response) {
    try {
      const user = await this.userUseCases.getUserById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Get all users
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: List of users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   */
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await this.userUseCases.getAllUsers();
      res.json(users);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * @swagger
   * /users/{id}/roles:
   *   put:
   *     summary: Assign a role to a user
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               role:
   *                 type: string
   *     responses:
   *       200:
   *         description: Role assigned
   */
  async assignRole(req: Request, res: Response) {
    try {
      const { role } = req.body;
      await this.userUseCases.assignRole(req.params.id, role);
      res.json({ message: `Role ${role} assigned successfully` });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
