import prisma from "../lib/prisma.js";

const DEFAULT_RECOMMENDATIONS_LIMIT = 4;
const MAX_RECOMMENDATIONS_LIMIT = 12;
const PURCHASE_CATEGORY_WEIGHT = 3;
const WISHLIST_CATEGORY_WEIGHT = 2;
const CART_CATEGORY_WEIGHT = 1;

const normalizeCategory = (category) => String(category || "").trim().toLowerCase();

const normalizeProduct = (product) => ({
  ...product,
  price: Number(product.price),
});

function normalizeLimit(limit) {
  const parsedLimit = Number(limit);

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    return DEFAULT_RECOMMENDATIONS_LIMIT;
  }

  return Math.min(parsedLimit, MAX_RECOMMENDATIONS_LIMIT);
}

function addCategoryScore(scores, category, points) {
  const normalizedCategory = normalizeCategory(category);

  if (!normalizedCategory) return;

  scores.set(
    normalizedCategory,
    (scores.get(normalizedCategory) || 0) + points,
  );
}

function sortByAffinity(products, categoryScores) {
  return [...products].sort((left, right) => {
    const scoreDifference = (
      categoryScores.get(normalizeCategory(right.category)) || 0
    ) - (
      categoryScores.get(normalizeCategory(left.category)) || 0
    );

    if (scoreDifference !== 0) return scoreDifference;

    const ratingDifference = Number(right.rating || 0) - Number(left.rating || 0);
    if (ratingDifference !== 0) return ratingDifference;

    return right.id - left.id;
  });
}

export async function getRecommendationsByUserId(
  userId,
  { db = prisma, limit = DEFAULT_RECOMMENDATIONS_LIMIT } = {},
) {
  const recommendationLimit = normalizeLimit(limit);
  const [purchasedItems, wishlistItems, cartItems] = await Promise.all([
    db.orderItem.findMany({
      where: { order: { userId } },
      select: {
        productId: true,
        quantity: true,
        product: { select: { category: true } },
      },
    }),
    db.wishlistItem.findMany({
      where: { userId },
      select: {
        productId: true,
        product: { select: { category: true } },
      },
    }),
    db.cartItem.findMany({
      where: { userId },
      select: {
        productId: true,
        product: { select: { category: true } },
      },
    }),
  ]);

  const categoryScores = new Map();
  const categoryNames = new Map();
  const excludedProductIds = new Set();

  for (const item of purchasedItems) {
    excludedProductIds.add(item.productId);
    const category = String(item.product?.category || "").trim();
    const quantity = Number.isInteger(item.quantity) && item.quantity > 0
      ? item.quantity
      : 1;

    addCategoryScore(
      categoryScores,
      category,
      quantity * PURCHASE_CATEGORY_WEIGHT,
    );
    if (category) categoryNames.set(normalizeCategory(category), category);
  }

  for (const item of wishlistItems) {
    excludedProductIds.add(item.productId);
    const category = String(item.product?.category || "").trim();

    addCategoryScore(categoryScores, category, WISHLIST_CATEGORY_WEIGHT);
    if (category) categoryNames.set(normalizeCategory(category), category);
  }

  for (const item of cartItems) {
    excludedProductIds.add(item.productId);
    const category = String(item.product?.category || "").trim();

    addCategoryScore(categoryScores, category, CART_CATEGORY_WEIGHT);
    if (category) categoryNames.set(normalizeCategory(category), category);
  }

  const rankedCategories = [...categoryScores.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([category]) => categoryNames.get(category));
  const baseWhere = {
    stock: { gt: 0 },
    ...(excludedProductIds.size > 0
      ? { id: { notIn: [...excludedProductIds] } }
      : {}),
  };
  let recommendations = [];

  if (rankedCategories.length > 0) {
    const matchingProducts = await db.product.findMany({
      where: {
        ...baseWhere,
        category: { in: rankedCategories },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    recommendations = sortByAffinity(matchingProducts, categoryScores)
      .slice(0, recommendationLimit);
  }

  if (recommendations.length < recommendationLimit) {
    const selectedIds = recommendations.map((product) => product.id);
    const fallbackProducts = await db.product.findMany({
      where: {
        stock: { gt: 0 },
        ...(excludedProductIds.size + selectedIds.length > 0
          ? { id: { notIn: [...excludedProductIds, ...selectedIds] } }
          : {}),
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: recommendationLimit - recommendations.length,
    });

    recommendations.push(...fallbackProducts);
  }

  return {
    strategy: rankedCategories.length > 0 ? "category_affinity" : "featured",
    categories: rankedCategories.slice(0, 3),
    items: recommendations.map(normalizeProduct),
  };
}
