import express from "express";
import { getReviewsByProductId } from "../controllers/reviews.controller.js";

const router = express.Router();

router.get("/:id/reviews", getReviewsByProductId);

export default router;