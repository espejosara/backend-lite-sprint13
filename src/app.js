import cors from "cors";
import express from "express";

import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import productsRoutes from "./routes/products.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";

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
app.use("/cart", cartRoutes);
app.use("/wishlist", wishlistRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;