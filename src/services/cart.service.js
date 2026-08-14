import prisma from "../lib/prisma.js";

const cartsByUser = new Map();
let nextItemId = 1;

const getOrCreateCart = (userId) => {
  if (!cartsByUser.has(userId)) {
    cartsByUser.set(userId, []);
  }
  return cartsByUser.get(userId);
};

const formatCart = (items) => {
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.quantity * item.price, 0);

  return {
    items,
    totalItems,
    totalPrice: Number(totalPrice.toFixed(2)),
  };
};

const getCartByUserId = (userId) => {
  const items = getOrCreateCart(userId);
  return formatCart(items);
};

const addCartItem = async ({ userId, productId, quantity = 1 }) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    const error = new Error("Producto no encontrado");
    error.status = 404;
    throw error;
  }

  const cartItems = getOrCreateCart(userId);
  const existingItem = cartItems.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cartItems.push({
      itemId: nextItemId++,
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      quantity,
    });
  }

  return formatCart(cartItems);
};

const removeCartItem = ({ userId, itemId }) => {
  const cartItems = getOrCreateCart(userId);
  const index = cartItems.findIndex((item) => item.itemId === itemId);

  if (index === -1) {
    const error = new Error("Item no encontrado en carrito");
    error.status = 404;
    throw error;
  }

  cartItems.splice(index, 1);
  return formatCart(cartItems);
};

const checkoutCart = (userId) => {
  const cartItems = getOrCreateCart(userId);
  const summary = formatCart(cartItems);
  cartsByUser.set(userId, []);

  return {
    message: "Compra realizada con éxito",
    ...summary,
  };
};

export { getCartByUserId, addCartItem, removeCartItem, checkoutCart };
