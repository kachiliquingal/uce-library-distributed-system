import { Router } from "express";
import { UserController } from "./controllers/UserController";
import { Neo4jUserRepository } from "../neo4j/Neo4jUserRepository";
import { UserUseCases } from "../../application/UserUseCases";

const router = Router();

// DI Setup
const userRepository = new Neo4jUserRepository();
const userUseCases = new UserUseCases(userRepository);
const userController = new UserController(userUseCases);

router.post("/users", (req, res) => userController.createUser(req, res));
router.get("/users", (req, res) => userController.getAllUsers(req, res));
router.get("/users/:id", (req, res) => userController.getUserById(req, res));
router.put("/users/:id/roles", (req, res) => userController.assignRole(req, res));

export default router;
