import express from "express";
import { createReview, getReviewsByProductId } from "../controllers/reviews.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/:id/reviews", getReviewsByProductId);
router.post("/:id/reviews", authenticateToken, createReview);

export default router;