import { parsePositiveInteger } from "../lib/validation.js";
import {
  getWishlistByUserId,
  toggleWishlistItem,
} from "../services/wishlist.service.js";

export async function getWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const wishlist = await getWishlistByUserId(userId);

    return res.json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    return next(error);
  }
}

export async function toggleWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const productId = parsePositiveInteger(req.params.productId);

    if (productId === null) {
      return res.status(400).json({
        success: false,
        error: "productId inválido",
      });
    }

    const result = await toggleWishlistItem(userId, productId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}
