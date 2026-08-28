import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";

import { corsOptions } from "./config/cors.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import productsRoutes from "./routes/products.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";

const app = express();

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

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
app.use("/orders", ordersRoutes);
app.use("/payments", paymentsRoutes);
app.use("/wishlist", wishlistRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
