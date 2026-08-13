import products from "../data/products.json" assert { type: "json" };

const parseId = (value) => Number(value);

const getProducts = (req, res) => {
  return res.json({
    success: true,
    data: products,
  });
};

const getProductById = (req, res) => {
  const id = parseId(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: "ID de producto inválido",
    });
  }

  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: "Producto no encontrado",
    });
  }

  return res.json({
    success: true,
    data: product,
  });
};

export { getProducts, getProductById };