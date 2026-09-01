import assert from "node:assert/strict";
import test from "node:test";
import { getProfileByUserId } from "../src/services/auth.service.js";

test("getProfileByUserId cuenta toda la wishlist aunque solo devuelva seis elementos", async () => {
  const wishlistItems = Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    productId: index + 10,
  }));
  const db = {
    user: {
      findUnique: async () => ({
        id: 7,
        name: "Ada",
        email: "ada@example.com",
        role: "user",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    },
    wishlistItem: {
      findMany: async () => wishlistItems,
      count: async () => 9,
    },
    order: {
      count: async () => 0,
      findFirst: async () => null,
    },
  };

  const profile = await getProfileByUserId(7, db);

  assert.equal(profile.wishlist.count, 9);
  assert.equal(profile.wishlist.items.length, 6);
});
