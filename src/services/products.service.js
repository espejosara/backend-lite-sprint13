import prisma from "../lib/prisma.js";

const normalizeProduct = (product) => ({
  ...product,
  price: Number(product.price),
});

const getAllProducts = async () => {
  const products = await prisma.product.findMany({
    orderBy: { id: "asc" },
  });

  return products.map(normalizeProduct);
};

const findProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  return product ? normalizeProduct(product) : null;
};

export { getAllProducts, findProductById };
