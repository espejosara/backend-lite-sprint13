import "dotenv/config";
import { validateEnvironment } from "./config/environment.js";

validateEnvironment();

const [appModule, prismaModule] = await Promise.all([
  import("./app.js"),
  import("./lib/prisma.js"),
]);
const app = appModule.default;
const prisma = prismaModule.default;

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} recibido. Cerrando el servidor...`);

  server.close(async (error) => {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error(disconnectError);
      process.exitCode = 1;
    }

    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
