const reviews = require("../data/reviews.json");

const parseId = (value) => Number(value);

const getReviewsByProductId = (req, res) => {
  const productId = parseId(req.params.id);

  if (Number.isNaN(productId)) {
    return res.status(400).json({
      success: false,
      error: "ID de producto inválido",
    });
  }

  const productReviews = reviews.filter((r) => r.productId === productId);

  return res.json({
    success: true,
    data: productReviews,
  });
};

module.exports = { getReviewsByProductId };