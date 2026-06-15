import { Request, Response } from "express";
import { UserUseCases } from "../../../application/UserUseCases";

export class UserController {
  constructor(private userUseCases: UserUseCases) {}

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userUseCases.createUser(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      if (error.message === "User already exists with this email") {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userUseCases.getAllUsers();
      res.status(200).json(users);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userUseCases.getUserById(req.params.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(200).json(user);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async assignRole(req: Request, res: Response): Promise<void> {
    try {
      await this.userUseCases.assignRole(req.params.id, req.body.roleName);
      res.status(200).json({ message: "Role assigned successfully" });
    } catch (error: any) {
      if (error.message === "User not found") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const permissions = await this.userUseCases.getPermissions(req.params.id);
      res.status(200).json({ permissions });
    } catch (error: any) {
      if (error.message === "User not found") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
}
