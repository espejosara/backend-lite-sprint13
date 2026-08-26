import assert from "node:assert/strict";
import test from "node:test";
import {
  createProduct,
  deleteProductById,
  findProductById,
  getAllProducts,
  updateProductById,
} from "../src/services/products.service.js";

const product = {
  id: 1,
  name: "Figura de prueba",
  category: "accion",
  description: "Producto para tests",
  price: "24.99",
  stock: 5,
  imageUrl: "https://example.com/product.png",
};

test("getAllProducts lista productos y normaliza el precio", async () => {
  const db = { product: { findMany: async () => [product] } };

  const result = await getAllProducts(db);

  assert.equal(result.length, 1);
  assert.equal(result[0].price, 24.99);
});

test("findProductById devuelve null si no existe", async () => {
  const db = { product: { findUnique: async () => null } };

  assert.equal(await findProductById(999, db), null);
});

test("createProduct envía los datos a Prisma", async () => {
  let createArgs = null;
  const db = {
    product: {
      create: async (args) => {
        createArgs = args;
        return product;
      },
    },
  };
  const payload = {
    name: product.name,
    category: product.category,
    description: product.description,
    price: 24.99,
    stock: product.stock,
    imageUrl: product.imageUrl,
  };

  const result = await createProduct(payload, db);

  assert.deepEqual(createArgs, { data: payload });
  assert.equal(result.price, 24.99);
});

test("updateProductById actualiza el producto indicado", async () => {
  let updateArgs = null;
  const db = {
    product: {
      update: async (args) => {
        updateArgs = args;
        return { ...product, ...args.data };
      },
    },
  };

  const result = await updateProductById(1, { stock: 8 }, db);

  assert.deepEqual(updateArgs, { where: { id: 1 }, data: { stock: 8 } });
  assert.equal(result.stock, 8);
});

test("deleteProductById elimina el producto indicado", async () => {
  let deleteArgs = null;
  const db = {
    product: {
      delete: async (args) => {
        deleteArgs = args;
      },
    },
  };

  await deleteProductById(1, db);

  assert.deepEqual(deleteArgs, { where: { id: 1 } });
});
