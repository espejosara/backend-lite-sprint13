import {
  getWishlistByUserId,
  toggleWishlistItem,
} from "../services/wishlist.service.js";

const toNumber = (value) => Number(value);

const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wishlist = await getWishlistByUserId(userId);

    return res.status(200).json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    return next(error);
  }
};

const toggleWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = toNumber(req.params.productId);

    if (Number.isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: "productId inválido",
      });
    }

    const result = await toggleWishlistItem(userId, productId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export { getWishlist, toggleWishlist };
