import prisma from "../lib/prisma.js";

const normalizeProduct = (product) => ({
  ...product,
  price: Number(product.price),
});

const getAllProducts = async (db = prisma) => {
  const products = await db.product.findMany({
    orderBy: { id: "asc" },
  });

  return products.map(normalizeProduct);
};

const findProductById = async (id, db = prisma) => {
  const product = await db.product.findUnique({
    where: { id },
  });

  return product ? normalizeProduct(product) : null;
};

const createProduct = async ({ name, category, description, price, stock, imageUrl }, db = prisma) => {
  const product = await db.product.create({
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

const updateProductById = async (id, data, db = prisma) => {
  const product = await db.product.update({
    where: { id },
    data,
  });

  return normalizeProduct(product);
};

const deleteProductById = async (id, db = prisma) => {
  await db.product.delete({
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
