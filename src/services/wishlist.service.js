import prisma from "../lib/prisma.js";

const wishlistsByUser = new Map();

const getOrCreateWishlist = (userId) => {
  if (!wishlistsByUser.has(userId)) {
    wishlistsByUser.set(userId, []);
  }
  return wishlistsByUser.get(userId);
};

const getWishlistByUserId = (userId) => {
  return getOrCreateWishlist(userId);
};

const addWishlistProduct = async ({ userId, productId }) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    const error = new Error("Producto no encontrado");
    error.status = 404;
    throw error;
  }

  const wishlist = getOrCreateWishlist(userId);
  const alreadyExists = wishlist.some((item) => item.id === product.id);

  if (!alreadyExists) {
    wishlist.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.imageUrl,
    });
  }

  return wishlist;
};

const removeWishlistProduct = ({ userId, productId }) => {
  const wishlist = getOrCreateWishlist(userId);
  const nextWishlist = wishlist.filter((item) => item.id !== productId);

  wishlistsByUser.set(userId, nextWishlist);

  return nextWishlist;
};

export { getWishlistByUserId, addWishlistProduct, removeWishlistProduct };
