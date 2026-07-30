const express = require("express");
const cors = require("cors");

const productsRoutes = require("./routes/products.routes");
const authRoutes = require("./routes/auth.routes");
const reviewsRoutes = require("./routes/reviews.routes");

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

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
  });
});

app.use("/products", productsRoutes);
app.use("/auth", authRoutes);
app.use("/reviews", reviewsRoutes);

module.exports = app;