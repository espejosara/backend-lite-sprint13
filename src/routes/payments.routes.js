import express from "express";
import { startCheckout } from "../controllers/payments.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/checkout-session", authenticateToken, startCheckout);

export default router;

