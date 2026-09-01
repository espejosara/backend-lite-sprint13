import { parsePositiveInteger } from "../lib/validation.js";
import {
  createReviewForProduct,
  findReviewsByProductId,
} from "../services/reviews.service.js";

const getReviewsByProductId = async (req, res, next) => {
  try {
    const productId = parsePositiveInteger(req.params.id);

    if (productId === null) {
      return res.status(400).json({
        success: false,
        error: "ID de producto inválido",
      });
    }

    const productReviews = await findReviewsByProductId(productId);

    return res.json({
      success: true,
      data: productReviews,
    });
  } catch (error) {
    return next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const productId = parsePositiveInteger(req.params.id);
    const rating = parsePositiveInteger(req.body?.rating);
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";

    if (productId === null) {
      return res.status(400).json({
        success: false,
        error: "ID de producto inválido",
      });
    }

    if (rating === null || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "La valoración debe estar entre 1 y 5",
      });
    }

    if (!comment) {
      return res.status(400).json({
        success: false,
        error: "El comentario es obligatorio",
      });
    }

    const review = await createReviewForProduct({
      userId: req.user.id,
      productId,
      rating,
      comment,
      author: req.user.email,
    });

    return res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    return next(error);
  }
};

export { getReviewsByProductId, createReview };
