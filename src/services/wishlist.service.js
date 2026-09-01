import prisma from "../lib/prisma.js";

export async function getWishlistByUserId(userId) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { productId: "asc" },
  });
}

export async function toggleWishlistItem(userId, productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    const error = new Error("Producto no encontrado");
    error.status = 404;
    throw error;
  }

  const existingItem = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
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
