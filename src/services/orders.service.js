import prisma from "../lib/prisma.js";

const toNumber = (value) => Number(value);

export function formatOrderWithProducts(order) {
  const products = order.items.map((item) => {
    const unitPrice = toNumber(item.unitPrice);
    const subtotal = unitPrice * item.quantity;

    return {
      orderItemId: item.id,
      productId: item.productId,
      name: item.product.name,
      imageUrl: item.product.imageUrl,
      quantity: item.quantity,
      unitPrice,
      subtotal,
    };
  });

  return {
    id: order.id,
    createdAt: order.createdAt,
    total: toNumber(order.total),
    products,
  };
}

export async function getOrdersByUserId(userId) {
  if (typeof prisma.order?.findMany !== "function") {
    const error = new Error(
      "El modelo Order no está disponible en Prisma Client. Ejecuta: npx prisma generate y reinicia el servidor.",
    );
    error.status = 500;
    throw error;
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map(formatOrderWithProducts);
}
