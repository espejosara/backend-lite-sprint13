import prisma from "../lib/prisma.js";

const getAllProducts = async () => {
  return prisma.product.findMany({
    orderBy: { id: "asc" },
  });
};

const findProductById = async (id) => {
  return prisma.product.findUnique({
    where: { id },
  });
};

export { getAllProducts, findProductById };
