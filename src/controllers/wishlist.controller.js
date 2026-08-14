import {
  addWishlistProduct,
  getWishlistByUserId,
  removeWishlistProduct,
} from "../services/wishlist.service.js";

const toNumber = (value) => Number(value);
const buildWishlistResponse = (wishlist) => ({
  success: true,
  data: wishlist,
});

const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wishlist = getWishlistByUserId(userId);

    return res.status(200).json(buildWishlistResponse(wishlist));
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

    return res.status(200).json(buildWishlistResponse(wishlist));
  } catch (error) {
    return next(error);
  }
};

const deleteWishlistItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = toNumber(req.params.productId);

    if (Number.isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: "productId inválido",
      });
    }

    const wishlist = removeWishlistProduct({ userId, productId });

    return res.status(200).json(buildWishlistResponse(wishlist));
  } catch (error) {
    return next(error);
  }
};

export { getWishlist, createWishlistItem, deleteWishlistItem };
