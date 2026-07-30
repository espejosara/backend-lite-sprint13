const express = require("express");
const { getReviewsByProductId } = require("../controllers/reviews.controller");

const router = express.Router();

router.get("/:id/reviews", getReviewsByProductId);

module.exports = router;