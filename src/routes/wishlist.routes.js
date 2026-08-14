import express from "express";
import {
  createWishlistItem,
  getWishlist,
} from "../controllers/wishlist.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getWishlist);
router.post("/:productId", createWishlistItem);

export default router;
