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

export async function removeCartItem({ userId, itemId }, db = prisma) {
  const item = await db.cartItem.findUnique({
    where: { id: itemId },
  });

  if (!item || item.userId !== userId) {
    const error = new Error("Item no encontrado en carrito");
    error.status = 404;
    throw error;
  }

  return await db.cartItem.delete({
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

  return await db.cartItem.update({
    where: { id: itemId },
    data: { quantity },
    include: { product: true },
  });
}

export async function checkoutCart(userId) {
  if (typeof prisma.order?.create !== "function") {
    const error = new Error(
      "El modelo Order no está disponible en Prisma Client. Ejecuta: npx prisma generate y reinicia el servidor.",
    );
    error.status = 500;
    throw error;
  }

  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (items.length === 0) {
    const error = new Error("El carrito está vacío");
    error.status = 400;
    throw error;
  }

  for (const item of items) {
    if (item.product.stock < item.quantity) {
      const error = new Error(
        `Stock insuficiente para ${item.product.name}. Disponible: ${item.product.stock}`,
      );
      error.status = 400;
      throw error;
    }
  }

  const total = items.reduce(
    (acc, item) => acc + Number(item.product.price) * item.quantity,
    0,
  );

  const order = await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          stock: { gte: item.quantity },
        },
        data: {
          stock: { decrement: item.quantity },
        },
      });

      if (updated.count === 0) {
        const error = new Error(
          `Stock insuficiente para ${item.product.name}. Intenta actualizar tu carrito`,
        );
        error.status = 400;
        throw error;
      }
    }

    const orderDelegate = tx.order ?? prisma.order;

    const createdOrder = await orderDelegate.create({
      data: {
        userId,
        total,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    await tx.cartItem.deleteMany({
      where: { userId },
    });

    return createdOrder;
  });

  return {
    message: "Compra realizada con éxito",
    order,
  };
}
