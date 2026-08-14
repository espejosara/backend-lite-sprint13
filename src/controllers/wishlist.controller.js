import {
  addWishlistProduct,
  getWishlistByUserId,
} from "../services/wishlist.service.js";

const toNumber = (value) => Number(value);

const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wishlist = getWishlistByUserId(userId);

    return res.json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    return next(error);
  }
};

const createWishlistItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = toNumber(req.params.productId);

    if (Number.isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: "productId inválido",
      });
    }

    const wishlist = await addWishlistProduct({ userId, productId });

    return res.status(201).json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    return next(error);
  }
};

export { getWishlist, createWishlistItem };
