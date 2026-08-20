import express from "express";
import {
  checkout,
  createCartItem,
  deleteCartItem,
  getAllCartsAdmin,
  getCart,
} from "../controllers/cart.controller.js";
import {
  authenticateToken,
  requireRole,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/all", requireRole("admin"), getAllCartsAdmin);
router.get("/", getCart);
router.post("/items", createCartItem);
router.delete("/items/:itemId", deleteCartItem);
router.post("/checkout", checkout);

export default router;
