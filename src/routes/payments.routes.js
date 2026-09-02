import express from "express";
import {
  getCheckoutConfirmation,
  startCheckout,
} from "../controllers/payments.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/checkout-session", authenticateToken, startCheckout);
router.get(
  "/checkout-session/:sessionId/order",
  authenticateToken,
  getCheckoutConfirmation,
);

export default router;
