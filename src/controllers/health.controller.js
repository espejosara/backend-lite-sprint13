import prisma from "../lib/prisma.js";

export function createHealthController(db = prisma) {
  return async function getHealth(req, res, next) {
    try {
      await db.$queryRaw`SELECT 1`;

      return res.json({
        success: true,
        data: {
          status: "ok",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (cause) {
      const error = new Error("La base de datos no está disponible", { cause });
      error.status = 503;
      return next(error);
    }
  };
}

export const getHealth = createHealthController();
