import express from "express";
import {
  checkout,
  createCartItem,
  deleteCartItem,
  getCart,
} from "../controllers/cart.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getCart);
router.post("/items", createCartItem);
router.delete("/items/:itemId", deleteCartItem);
router.post("/checkout", checkout);

export default router;
