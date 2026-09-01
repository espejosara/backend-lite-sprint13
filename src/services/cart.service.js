import prisma from "../lib/prisma.js";

export async function getCartByUserId(userId) {
  return prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { productId: "asc" },
  });
}

export async function getAllCarts() {
  return prisma.cartItem.findMany({
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

export async function addCartItem({ userId, productId, quantity = 1 }, db = prisma) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    const error = new Error("La cantidad debe ser mayor a 0");
    error.status = 400;
    throw error;
  }

  const product = await db.product.findUnique({
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

  const existingItem = await db.cartItem.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  if (existingItem) {
    const nextQuantity = existingItem.quantity + quantity;

    if (nextQuantity > product.stock) {
      const error = new Error(`Stock insuficiente. Disponible: ${product.stock}`);
      error.status = 400;
      throw error;
    }

    return db.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: nextQuantity },
      include: { product: true },
    });
  }

  return db.cartItem.create({
    data: { userId, productId, quantity },
    include: { product: true },
  });
}

export async function removeCartItem({ userId, itemId }, db = prisma) {
  const item = await db.cartItem.findUnique({
    where: { id: itemId },
  });

  if (!item || item.userId !== userId) {
    const error = new Error("Item no encontrado en carrito");
    error.status = 404;
    throw error;
  }

  return db.cartItem.delete({
    where: { id: itemId },
  });
}

export async function updateCartItemQuantity({ userId, itemId, quantity }, db = prisma) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    const error = new Error("La cantidad debe ser un número entero mayor a 0");
    error.status = 400;
    throw error;
  }

  const item = await db.cartItem.findUnique({
    where: { id: itemId },
    include: { product: true },
  });

  if (!item || item.userId !== userId) {
    const error = new Error("Item no encontrado en carrito");
    error.status = 404;
    throw error;
  }

  if (quantity > item.product.stock) {
    const error = new Error(
      `Stock insuficiente. Disponible: ${item.product.stock}`,
    );
    error.status = 400;
    throw error;
  }

  return db.cartItem.update({
    where: { id: itemId },
    data: { quantity },
    include: { product: true },
  });
}
