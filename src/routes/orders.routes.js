import express from "express";
import { getOrders } from "../controllers/orders.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getOrders);

export default router;
