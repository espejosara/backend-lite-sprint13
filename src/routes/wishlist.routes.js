import express from "express";
import {
  createWishlistItem,
  deleteWishlistItem,
  getWishlist,
} from "../controllers/wishlist.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getWishlist);
router.post("/:productId", createWishlistItem);
router.delete("/:productId", deleteWishlistItem);

export default router;
