import { Router } from "express";
import { requireAuth } from "../security/auth.middleware";
import { authController } from "./auth.controller";

const router = Router();

router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.post("/logout", requireAuth, authController.logout);

export const authRoutes = router;
