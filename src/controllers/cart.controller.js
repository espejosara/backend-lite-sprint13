import { parsePositiveInteger } from "../lib/validation.js";
import {
  addCartItem,
  getAllCarts,
  getCartByUserId,
  removeCartItem,
  updateCartItemQuantity,
} from "../services/cart.service.js";

export async function getCart(req, res, next) {
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
}

export async function getAllCartsAdmin(req, res, next) {
  try {
    const carts = await getAllCarts();

    return res.json({
      success: true,
      data: carts,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createCartItem(req, res, next) {
  try {
    const userId = req.user.id;
    const productId = parsePositiveInteger(req.body?.productId);
    const quantity = req.body?.quantity === undefined
      ? 1
      : parsePositiveInteger(req.body.quantity);

    if (productId === null) {
      return res.status(400).json({
        success: false,
        error: "productId debe ser un número entero mayor a 0",
      });
    }

    if (quantity === null) {
      return res.status(400).json({
        success: false,
        error: "quantity debe ser un número entero mayor a 0",
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
}

export async function updateCartItem(req, res, next) {
  try {
    const userId = req.user.id;
    const itemId = parsePositiveInteger(req.params.itemId);
    const quantity = parsePositiveInteger(req.body?.quantity);

    if (itemId === null) {
      return res.status(400).json({
        success: false,
        error: "itemId inválido",
      });
    }

    if (quantity === null) {
      return res.status(400).json({
        success: false,
        error: "quantity debe ser un número entero mayor a 0",
      });
    }

    const item = await updateCartItemQuantity({ userId, itemId, quantity });

    return res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteCartItem(req, res, next) {
  try {
    const userId = req.user.id;
    const itemId = parsePositiveInteger(req.params.itemId);

    if (itemId === null) {
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
}
