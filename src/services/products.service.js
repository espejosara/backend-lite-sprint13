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

const createProduct = async ({ name, category, description, price, stock, imageUrl }) => {
  const product = await prisma.product.create({
    data: {
      name,
      category,
      description,
      price,
      stock,
      imageUrl,
    },
  });

  return normalizeProduct(product);
};

const updateProductById = async (id, data) => {
  const product = await prisma.product.update({
    where: { id },
    data,
  });

  return normalizeProduct(product);
};

const deleteProductById = async (id) => {
  await prisma.product.delete({
    where: { id },
  });
};

export {
  createProduct,
  deleteProductById,
  findProductById,
  getAllProducts,
  updateProductById,
};
