import {
  addCartItem,
  checkoutCart,
  getCartByUserId,
  removeCartItem,
} from "../services/cart.service.js";

const toNumber = (value) => Number(value);

export async function getCart(req, res, next) {
  try {
    const userId = req.user.id;
    const cart = await getCartByUserId(userId);

    res.json({
      ok: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCartItem(req, res, next) {
  try {
    const userId = req.user.id;
    const productId = toNumber(req.body.productId);
    const quantity = req.body.quantity ? toNumber(req.body.quantity) : 1;

    if (Number.isNaN(productId) || Number.isNaN(quantity)) {
      res.status(400).json({
        ok: false,
        error: "productId y quantity deben ser números válidos",
      });
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      res.status(400).json({
        ok: false,
        error: "quantity debe ser un número entero mayor a 0",
      });
      return;
    }

    const cart = await addCartItem({ userId, productId, quantity });

    res.status(201).json({
      ok: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCartItem(req, res, next) {
  try {
    const userId = req.user.id;
    const itemId = toNumber(req.params.itemId);

    if (Number.isNaN(itemId)) {
      res.status(400).json({
        ok: false,
        error: "itemId inválido",
      });
      return;
    }

    await removeCartItem({ userId, itemId });

    res.json({
      ok: true,
      data: { message: "Item eliminado del carrito" },
    });
  } catch (error) {
    next(error);
  }
}

export async function checkout(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await checkoutCart(userId);

    res.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
