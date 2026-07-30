const products = require("../data/products.json");

const getProducts = (req, res) => {
  return res.json({
    success: true,
    data: products,
  });
};

const getProductById = (req, res) => {
  const id = Number(req.params.id);
  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: "Product not found",
    });
  }

  return res.json({
    success: true,
    data: product,
  });
};

module.exports = { getProducts, getProductById };