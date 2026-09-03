import assert from "node:assert/strict";
import test from "node:test";
import { getRecommendationsByUserId } from "../src/services/recommendations.service.js";

const product = (id, category, rating) => ({
  id,
  name: `Producto ${id}`,
  category,
  description: "Descripción",
  price: "19.99",
  stock: 4,
  rating,
  imageUrl: `https://example.com/${id}.jpg`,
  createdAt: new Date(`2026-01-${String(id).padStart(2, "0")}T00:00:00.000Z`),
});

test("prioriza categorías compradas y excluye compras y favoritos", async () => {
  const productQueries = [];
  const db = {
    orderItem: {
      findMany: async () => [{
        productId: 1,
        quantity: 2,
        product: { category: "Libros" },
      }],
    },
    wishlistItem: {
      findMany: async () => [{
        productId: 2,
        product: { category: "Arte" },
      }],
    },
    cartItem: { findMany: async () => [] },
    product: {
      findMany: async (query) => {
        productQueries.push(query);
        return productQueries.length === 1
          ? [product(4, "Arte", 5), product(3, "Libros", 3)]
          : [product(5, "Tecnología", 5)];
      },
    },
  };

  const result = await getRecommendationsByUserId(7, { db, limit: 3 });

  assert.equal(result.strategy, "category_affinity");
  assert.deepEqual(result.categories, ["Libros", "Arte"]);
  assert.deepEqual(result.items.map((item) => item.id), [3, 4, 5]);
  assert.equal(result.items[0].price, 19.99);
  assert.deepEqual(productQueries[0].where.id.notIn.sort(), [1, 2]);
  assert.deepEqual(productQueries[0].where.category.in, ["Libros", "Arte"]);
});

test("usa productos destacados cuando el usuario todavía no tiene señales", async () => {
  let receivedProductQuery;
  const db = {
    orderItem: { findMany: async () => [] },
    wishlistItem: { findMany: async () => [] },
    cartItem: { findMany: async () => [] },
    product: {
      findMany: async (query) => {
        receivedProductQuery = query;
        return [product(8, "Juegos", 5), product(9, "Libros", 4)];
      },
    },
  };

  const result = await getRecommendationsByUserId(10, { db });

  assert.equal(result.strategy, "featured");
  assert.deepEqual(result.categories, []);
  assert.deepEqual(result.items.map((item) => item.id), [8, 9]);
  assert.deepEqual(receivedProductQuery.where, { stock: { gt: 0 } });
  assert.equal(receivedProductQuery.take, 4);
});

test("limita el número máximo de recomendaciones", async () => {
  let receivedTake;
  const db = {
    orderItem: { findMany: async () => [] },
    wishlistItem: { findMany: async () => [] },
    cartItem: { findMany: async () => [] },
    product: {
      findMany: async ({ take }) => {
        receivedTake = take;
        return [];
      },
    },
  };

  await getRecommendationsByUserId(7, { db, limit: 100 });

  assert.equal(receivedTake, 12);
});

test("usa el carrito como señal y no recomienda sus productos", async () => {
  let receivedQuery;
  const db = {
    orderItem: { findMany: async () => [] },
    wishlistItem: { findMany: async () => [] },
    cartItem: {
      findMany: async () => [{
        productId: 6,
        product: { category: "Tecnología" },
      }],
    },
    product: {
      findMany: async (query) => {
        receivedQuery = query;
        return [product(7, "Tecnología", 4)];
      },
    },
  };

  const result = await getRecommendationsByUserId(7, { db, limit: 1 });

  assert.equal(result.strategy, "category_affinity");
  assert.deepEqual(result.categories, ["Tecnología"]);
  assert.deepEqual(receivedQuery.where.id.notIn, [6]);
  assert.equal(result.items[0].id, 7);
});
