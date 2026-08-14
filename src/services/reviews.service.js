import prisma from "../lib/prisma.js";

const findReviewsByProductId = async (productId) => {
  return prisma.review.findMany({
    where: { productId },
    orderBy: { id: "asc" },
  });
};

const createReviewForProduct = async ({ userId, productId, rating, comment, author }) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    const error = new Error("Producto no encontrado");
    error.status = 404;
    throw error;
  }

  return prisma.review.create({
    data: {
      productId,
      userId,
      author,
      rating,
      comment,
    },
  });
};

export { findReviewsByProductId, createReviewForProduct };
