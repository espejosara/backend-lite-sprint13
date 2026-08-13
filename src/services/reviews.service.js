import prisma from "../lib/prisma.js";

const findReviewsByProductId = async (productId) => {
  return prisma.review.findMany({
    where: { productId },
    orderBy: { id: "asc" },
  });
};

export { findReviewsByProductId };
