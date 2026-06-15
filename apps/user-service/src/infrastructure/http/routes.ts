import { Router } from "express";
import { UserController } from "./controllers/UserController";
import { UserUseCases } from "../../application/UserUseCases";
import { Neo4jUserRepository } from "../neo4j/Neo4jUserRepository";

const router = Router();

// DI Setup
const userRepository = new Neo4jUserRepository();
const userUseCases = new UserUseCases(userRepository);
const userController = new UserController(userUseCases);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: User already exists
 */
router.post("/", (req, res) => userController.createUser(req, res));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get("/", (req, res) => userController.getAllUsers(req, res));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get("/:id", (req, res) => userController.getUserById(req, res));

/**
 * @swagger
 * /api/users/{id}/roles:
 *   put:
 *     summary: Assign role to user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleName
 *             properties:
 *               roleName:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *     responses:
 *       200:
 *         description: Role assigned
 *       404:
 *         description: User not found
 */
router.put("/:id/roles", (req, res) => userController.assignRole(req, res));

/**
 * @swagger
 * /api/users/{id}/permissions:
 *   get:
 *     summary: Get user permissions based on roles
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of permissions
 *       404:
 *         description: User not found
 */
router.get("/:id/permissions", (req, res) => userController.getPermissions(req, res));

export { router };
