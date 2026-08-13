import express from "express";
import cors from "cors";

import productsRoutes from "./routes/products.routes.js";
import authRoutes from "./routes/auth.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    data: "API backend-lite funcionando",
  });
});

app.use("/products", productsRoutes);
app.use("/products", reviewsRoutes);
app.use("/auth", authRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
  });
});

export default app;