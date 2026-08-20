import {
  createProduct,
  deleteProductById,
  findProductById,
  getAllProducts,
  updateProductById,
} from "../services/products.service.js";

const parseId = (value) => Number(value);

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const validateProductPayload = (payload, { partial = false } = {}) => {
  const name = normalizeText(payload.name);
  const category = normalizeText(payload.category);
  const description = normalizeText(payload.description);
  const imageUrl = normalizeText(payload.imageUrl);
  const price = payload.price !== undefined ? Number(payload.price) : undefined;
  const stock = payload.stock !== undefined ? Number(payload.stock) : undefined;

  if (!partial || payload.name !== undefined) {
    if (!name) {
      return { error: "El nombre del producto es obligatorio" };
    }
  }

  if (!partial || payload.category !== undefined) {
    if (!category) {
      return { error: "La categoría del producto es obligatoria" };
    }
  }

  if (!partial || payload.description !== undefined) {
    if (!description) {
      return { error: "La descripción del producto es obligatoria" };
    }
  }

  if (!partial || payload.imageUrl !== undefined) {
    if (!imageUrl) {
      return { error: "La imagen del producto es obligatoria" };
    }
  }

  if (!partial || payload.price !== undefined) {
    if (!Number.isFinite(price) || price <= 0) {
      return { error: "El precio debe ser un número mayor a 0" };
    }
  }

  if (!partial || payload.stock !== undefined) {
    if (!Number.isInteger(stock) || stock < 0) {
      return { error: "El stock debe ser un número entero mayor o igual a 0" };
    }
  }

  const data = {};

  if (!partial || payload.name !== undefined) {
    data.name = name;
  }
  if (!partial || payload.category !== undefined) {
    data.category = category;
  }
  if (!partial || payload.description !== undefined) {
    data.description = description;
  }
  if (!partial || payload.imageUrl !== undefined) {
    data.imageUrl = imageUrl;
  }
  if (!partial || payload.price !== undefined) {
    data.price = price;
  }
  if (!partial || payload.stock !== undefined) {
    data.stock = stock;
  }

  return { data };
};

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

const createProductAdmin = async (req, res, next) => {
  try {
    const { data, error } = validateProductPayload(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error,
      });
    }

    const product = await createProduct(data);

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return next(error);
  }
};

const updateProductAdmin = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "ID de producto inválido",
      });
    }

    const existingProduct = await findProductById(id);

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: "Producto no encontrado",
      });
    }

    const { data, error } = validateProductPayload(req.body, { partial: true });

    if (error) {
      return res.status(400).json({
        success: false,
        error,
      });
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Debes enviar al menos un campo para actualizar",
      });
    }

    const product = await updateProductById(id, data);

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteProductAdmin = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "ID de producto inválido",
      });
    }

    const existingProduct = await findProductById(id);

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: "Producto no encontrado",
      });
    }

    await deleteProductById(id);

    return res.json({
      success: true,
      data: { message: "Producto eliminado" },
    });
  } catch (error) {
    return next(error);
  }
};

export {
  createProductAdmin,
  deleteProductAdmin,
  getProductById,
  getProducts,
  updateProductAdmin,
};