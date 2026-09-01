import assert from "node:assert/strict";
import test from "node:test";
import {
  addCartItem,
  removeCartItem,
  updateCartItemQuantity,
} from "../src/services/cart.service.js";

const cartItem = {
  id: 7,
  userId: 2,
  productId: 3,
  quantity: 3,
  product: {
    id: 3,
    name: "Figura de prueba",
    stock: 5,
  },
};

function createCartDb(item = cartItem) {
  let updateArgs = null;
  let deleteArgs = null;

  return {
    db: {
      cartItem: {
        findUnique: async () => item,
        update: async (args) => {
          updateArgs = args;
          return { ...item, ...args.data };
        },
        delete: async (args) => {
          deleteArgs = args;
          return item;
        },
      },
    },
    getUpdateArgs: () => updateArgs,
    getDeleteArgs: () => deleteArgs,
  };
}

function createAddCartDb({ existingItem = null, stock = 5 } = {}) {
  let updateArgs = null;
  let createArgs = null;

  return {
    db: {
      product: {
        findUnique: async () => ({ ...cartItem.product, stock }),
      },
      cartItem: {
        findUnique: async () => existingItem,
        update: async (args) => {
          updateArgs = args;
          return { ...existingItem, ...args.data };
        },
        create: async (args) => {
          createArgs = args;
          return { id: 8, ...args.data };
        },
      },
    },
    getUpdateArgs: () => updateArgs,
    getCreateArgs: () => createArgs,
  };
}

test("addCartItem crea una línea nueva con una cantidad válida", async () => {
  const { db, getCreateArgs } = createAddCartDb();

  await addCartItem({ userId: 2, productId: 3, quantity: 2 }, db);

  assert.deepEqual(getCreateArgs(), {
    data: { userId: 2, productId: 3, quantity: 2 },
    include: { product: true },
  });
});

test("addCartItem valida el stock total al incrementar una línea existente", async () => {
  const { db, getUpdateArgs } = createAddCartDb({
    existingItem: cartItem,
    stock: 5,
  });

  await assert.rejects(
    () => addCartItem({ userId: 2, productId: 3, quantity: 3 }, db),
    (error) => error.status === 400 && error.message === "Stock insuficiente. Disponible: 5",
  );
  assert.equal(getUpdateArgs(), null);
});

test("addCartItem actualiza la línea si la suma no supera el stock", async () => {
  const { db, getUpdateArgs } = createAddCartDb({
    existingItem: cartItem,
    stock: 5,
  });

  await addCartItem({ userId: 2, productId: 3, quantity: 2 }, db);

  assert.equal(getUpdateArgs().data.quantity, 5);
});

test("updateCartItemQuantity actualiza una cantidad válida", async () => {
  const { db, getUpdateArgs } = createCartDb();

  const result = await updateCartItemQuantity({ userId: 2, itemId: 7, quantity: 2 }, db);

  assert.equal(result.quantity, 2);
  assert.deepEqual(getUpdateArgs(), {
    where: { id: 7 },
    data: { quantity: 2 },
    include: { product: true },
  });
});

test("updateCartItemQuantity rechaza cantidades inválidas", async () => {
  const { db } = createCartDb();

  for (const quantity of [0, -1, 1.5]) {
    await assert.rejects(
      () => updateCartItemQuantity({ userId: 2, itemId: 7, quantity }, db),
      (error) => error.status === 400 && error.message.includes("entero mayor a 0"),
    );
  }
});

test("updateCartItemQuantity impide modificar el carrito de otro usuario", async () => {
  const { db, getUpdateArgs } = createCartDb();

  await assert.rejects(
    () => updateCartItemQuantity({ userId: 99, itemId: 7, quantity: 2 }, db),
    (error) => error.status === 404 && error.message === "Item no encontrado en carrito",
  );
  assert.equal(getUpdateArgs(), null);
});

test("updateCartItemQuantity rechaza cantidades superiores al stock", async () => {
  const { db, getUpdateArgs } = createCartDb();

  await assert.rejects(
    () => updateCartItemQuantity({ userId: 2, itemId: 7, quantity: 6 }, db),
    (error) => error.status === 400 && error.message === "Stock insuficiente. Disponible: 5",
  );
  assert.equal(getUpdateArgs(), null);
});

test("removeCartItem elimina la línea completa del usuario", async () => {
  const { db, getDeleteArgs } = createCartDb();

  await removeCartItem({ userId: 2, itemId: 7 }, db);

  assert.deepEqual(getDeleteArgs(), { where: { id: 7 } });
});

test("removeCartItem no elimina líneas de otro usuario", async () => {
  const { db, getDeleteArgs } = createCartDb();

  await assert.rejects(
    () => removeCartItem({ userId: 99, itemId: 7 }, db),
    (error) => error.status === 404 && error.message === "Item no encontrado en carrito",
  );
  assert.equal(getDeleteArgs(), null);
});
