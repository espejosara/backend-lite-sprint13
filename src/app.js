import cors from "cors";
import express from "express";

import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import productsRoutes from "./routes/products.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";

const app = express();

const defaultOrigins = ["http://localhost:5173"];

const allowedOrigins = [
  ...defaultOrigins,
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : []),
];

const corsOptions = process.env.ALLOW_ALL_ORIGINS === "true"
  ? {}
  : {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("No permitido por CORS"));
      },
    };

app.use(cors(corsOptions));

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