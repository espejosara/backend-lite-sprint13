import { findProductById, getAllProducts } from "../services/products.service.js";

const parseId = (value) => Number(value);

const getProducts = async (req, res, next) => {
  try {
    const products = await getAllProducts();

    return res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    return next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "ID de producto inválido",
      });
    }

    const product = await findProductById(id);

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
  } catch (error) {
    return next(error);
  }
};

export { getProducts, getProductById };