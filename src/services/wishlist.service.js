import prisma from "../lib/prisma.js";

export async function getWishlistByUserId(userId) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { productId: "asc" },
  });
}

export async function toggleWishlistItem(userId, productId) {
  const existingItem = await prisma.wishlistItem.findFirst({
    where: { userId, productId },
  });

  if (existingItem) {
    await prisma.wishlistItem.delete({
      where: { id: existingItem.id },
    });

    return { removed: true };
  }

  await prisma.wishlistItem.create({
    data: { userId, productId },
  });

  return { removed: false };
}
