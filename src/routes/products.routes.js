import express from "express";
import {
  createProductAdmin,
  deleteProductAdmin,
  getProductById,
  getProducts,
  updateProductAdmin,
} from "../controllers/products.controller.js";
import {
  authenticateToken,
  requireRole,
} from "../middlewares/auth.middleware.js";
import { parseProductImage } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post(
  "/",
  authenticateToken,
  requireRole("admin"),
  parseProductImage,
  createProductAdmin,
);
router.put(
  "/:id",
  authenticateToken,
  requireRole("admin"),
  parseProductImage,
  updateProductAdmin,
);
router.delete("/:id", authenticateToken, requireRole("admin"), deleteProductAdmin);

export default router;
