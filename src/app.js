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

app.use("/products", productsRoutes);
app.use("/products", reviewsRoutes);
app.use("/auth", authRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
  });
});

module.exports = app;