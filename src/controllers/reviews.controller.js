const reviews = require("../data/reviews.json");

const getReviewsByProductId = (req, res) => {
  const productId = Number(req.params.id);
  const productReviews = reviews.filter((r) => r.productId === productId);

  return res.json({
    success: true,
    data: productReviews,
  });
};

module.exports = { getReviewsByProductId };