import prisma from "../lib/prisma.js";

export async function getCartByUserId(userId) {
  return await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { productId: "asc" },
  });
}

export async function getAllCarts() {
  return await prisma.cartItem.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      product: true,
    },
    orderBy: [{ userId: "asc" }, { productId: "asc" }],
  });
}

export async function addCartItem({ userId, productId, quantity = 1 }) {
  if (quantity < 1) {
    const error = new Error("La cantidad debe ser mayor a 0");
    error.status = 400;
    throw error;
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    const error = new Error("Producto no encontrado");
    error.status = 404;
    throw error;
  }

  if (product.stock < quantity) {
    const error = new Error(`Stock insuficiente. Disponible: ${product.stock}`);
    error.status = 400;
    throw error;
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: { userId, productId },
  });

  if (existingItem) {
    return await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
      include: { product: true },
    });
  }

  return await prisma.cartItem.create({
    data: { userId, productId, quantity },
    include: { product: true },
  });
}

export async function removeCartItem({ userId, itemId }) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
  });

  if (!item || item.userId !== userId) {
    const error = new Error("Item no encontrado en carrito");
    error.status = 404;
    throw error;
  }

  return await prisma.cartItem.delete({
    where: { id: itemId },
  });
}

export async function checkoutCart(userId) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  await prisma.cartItem.deleteMany({
    where: { userId },
  });

  return {
    message: "Compra realizada con éxito",
    items,
  };
}
