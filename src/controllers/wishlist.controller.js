import {
  getWishlistByUserId,
  toggleWishlistItem,
} from "../services/wishlist.service.js";

const toNumber = (value) => Number(value);

export async function getWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const wishlist = await getWishlistByUserId(userId);

    res.json({
      ok: true,
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const productId = toNumber(req.params.productId);

    if (Number.isNaN(productId)) {
      res.status(400).json({
        ok: false,
        error: "productId inválido",
      });
      return;
    }

    const result = await toggleWishlistItem(userId, productId);

    res.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
