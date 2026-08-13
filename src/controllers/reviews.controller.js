import { findReviewsByProductId } from "../services/reviews.service.js";

const parseId = (value) => Number(value);

const getReviewsByProductId = async (req, res, next) => {
  try {
    const productId = parseId(req.params.id);

    if (Number.isNaN(productId)) {
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

export { getReviewsByProductId };