import express from "express";
import {
  createCartItem,
  deleteCartItem,
  getAllCartsAdmin,
  getCart,
  updateCartItem,
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
router.patch("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", deleteCartItem);

export default router;
