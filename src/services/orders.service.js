import prisma from "../lib/prisma.js";

export async function getOrdersByUserId(userId) {
  if (typeof prisma.order?.findMany !== "function") {
    const error = new Error(
      "El modelo Order no está disponible en Prisma Client. Ejecuta: npx prisma generate y reinicia el servidor.",
    );
    error.status = 500;
    throw error;
  }

  return await prisma.order.findMany({
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
}
