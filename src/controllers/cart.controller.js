import {
  addCartItem,
  checkoutCart,
  getCartByUserId,
  removeCartItem,
} from "../services/cart.service.js";

const toNumber = (value) => Number(value);

const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cart = await getCartByUserId(userId);

    return res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    return next(error);
  }
};

const createCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = toNumber(req.body.productId);
    const quantity = req.body.quantity ? toNumber(req.body.quantity) : 1;

    if (Number.isNaN(productId) || Number.isNaN(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: "productId y quantity válidos son obligatorios",
      });
    }

    const cart = await addCartItem({ userId, productId, quantity });

    return res.status(201).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = toNumber(req.params.itemId);

    if (Number.isNaN(itemId)) {
      return res.status(400).json({
        success: false,
        error: "itemId inválido",
      });
    }

    await removeCartItem({ userId, itemId });

    return res.json({
      success: true,
      data: { message: "Item eliminado del carrito" },
    });
  } catch (error) {
    return next(error);
  }
};

const checkout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await checkoutCart(userId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export { getCart, createCartItem, deleteCartItem, checkout };
