import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStripeLineItems,
  createCheckoutSession,
  getCheckoutOrder,
  priceToMinorUnits,
} from "../src/services/payments.service.js";

const user = {
  id: 7,
  email: "ada@example.com",
};

const cartItems = [
  {
    id: 10,
    userId: 7,
    productId: 3,
    quantity: 2,
    product: {
      id: 3,
      name: "Libro de arte",
      description: "Edición coleccionista",
      price: "19.99",
      stock: 4,
      imageUrl: "https://res.cloudinary.com/demo/image/upload/book.jpg",
    },
  },
];

function createDependencies(items = cartItems) {
  let checkoutPayload;

  return {
    dependencies: {
      db: {
        cartItem: {
          findMany: async () => items,
        },
      },
      stripe: {
        checkout: {
          sessions: {
            create: async (payload) => {
              checkoutPayload = payload;
              return {
                id: "cs_test_123",
                url: "https://checkout.stripe.com/c/pay/cs_test_123",
              };
            },
          },
        },
      },
      environment: {
        FRONTEND_URL: "https://tienda.example.com/una-ruta",
        STRIPE_CURRENCY: "EUR",
      },
    },
    getCheckoutPayload: () => checkoutPayload,
  };
}

test("priceToMinorUnits convierte euros a céntimos", () => {
  assert.equal(priceToMinorUnits("19.99"), 1999);
  assert.equal(priceToMinorUnits(10), 1000);
});

test("priceToMinorUnits rechaza importes fuera del rango seguro", () => {
  assert.throws(
    () => priceToMinorUnits(Number.MAX_VALUE),
    /precio fuera de rango/,
  );
});

test("buildStripeLineItems conserva producto, precio y cantidad del servidor", () => {
  const [lineItem] = buildStripeLineItems(cartItems);

  assert.equal(lineItem.price_data.unit_amount, 1999);
  assert.equal(lineItem.price_data.currency, "eur");
  assert.equal(lineItem.price_data.product_data.metadata.productId, "3");
  assert.equal(lineItem.quantity, 2);
});

test("createCheckoutSession crea una sesión de pago con el carrito de la base de datos", async () => {
  const { dependencies, getCheckoutPayload } = createDependencies();

  const result = await createCheckoutSession(user, dependencies);
  const payload = getCheckoutPayload();

  assert.deepEqual(result, {
    sessionId: "cs_test_123",
    url: "https://checkout.stripe.com/c/pay/cs_test_123",
  });
  assert.equal(payload.mode, "payment");
  assert.equal(payload.line_items[0].price_data.unit_amount, 1999);
  assert.equal(payload.client_reference_id, "7");
  assert.equal(payload.customer_email, "ada@example.com");
  assert.equal(payload.metadata.userId, "7");
  assert.equal(
    payload.success_url,
    "https://tienda.example.com/checkout/success?session_id={CHECKOUT_SESSION_ID}",
  );
  assert.equal(
    payload.cancel_url,
    "https://tienda.example.com/checkout?canceled=true",
  );
});

test("createCheckoutSession rechaza un carrito vacío", async () => {
  const { dependencies } = createDependencies([]);

  await assert.rejects(
    () => createCheckoutSession(user, dependencies),
    (error) => error.status === 400 && error.message === "El carrito está vacío",
  );
});

test("createCheckoutSession rechaza más de cien productos diferentes", async () => {
  const tooManyItems = Array.from({ length: 101 }, (_, index) => ({
    ...cartItems[0],
    id: index + 1,
    productId: index + 1,
    product: {
      ...cartItems[0].product,
      id: index + 1,
    },
  }));
  const { dependencies } = createDependencies(tooManyItems);

  await assert.rejects(
    () => createCheckoutSession(user, dependencies),
    (error) => error.status === 400 && error.message.includes("máximo de 100"),
  );
});

test("createCheckoutSession vuelve a validar el stock", async () => {
  const withoutStock = [{
    ...cartItems[0],
    quantity: 5,
  }];
  const { dependencies } = createDependencies(withoutStock);

  await assert.rejects(
    () => createCheckoutSession(user, dependencies),
    (error) => error.status === 400 && error.message.includes("Stock insuficiente"),
  );
});

test("createCheckoutSession rechaza precios inválidos guardados en la base de datos", async () => {
  const invalidPriceItems = [{
    ...cartItems[0],
    product: {
      ...cartItems[0].product,
      price: 0,
    },
  }];
  const { dependencies } = createDependencies(invalidPriceItems);

  await assert.rejects(
    () => createCheckoutSession(user, dependencies),
    (error) => error.status === 500 && error.message.includes("precio no válido"),
  );
});

test("getCheckoutOrder devuelve únicamente el pedido de la sesión y del usuario", async () => {
  let receivedQuery;
  const order = {
    id: 41,
    userId: 7,
    total: "39.98",
    createdAt: new Date("2026-09-02T10:00:00.000Z"),
    items: [{
      id: 51,
      productId: 3,
      quantity: 2,
      unitPrice: "19.99",
      product: {
        name: "Libro de arte",
        imageUrl: "https://example.com/book.jpg",
      },
    }],
  };
  const db = {
    order: {
      findFirst: async (query) => {
        receivedQuery = query;
        return order;
      },
    },
  };

  const result = await getCheckoutOrder({
    sessionId: "cs_test_123",
    userId: 7,
  }, db);

  assert.deepEqual(receivedQuery.where, {
    stripeCheckoutSessionId: "cs_test_123",
    userId: 7,
  });
  assert.equal(result.id, 41);
  assert.equal(result.total, 39.98);
  assert.equal(result.products[0].subtotal, 39.98);
});

test("getCheckoutOrder no revela pedidos de otra sesión o usuario", async () => {
  const db = {
    order: {
      findFirst: async () => null,
    },
  };

  const result = await getCheckoutOrder({
    sessionId: "cs_test_private",
    userId: 8,
  }, db);

  assert.equal(result, null);
});

test("getCheckoutOrder rechaza identificadores de sesión manipulados", async () => {
  await assert.rejects(
    () => getCheckoutOrder({ sessionId: "../otra-ruta", userId: 7 }),
    (error) => error.status === 400 && error.message.includes("session_id"),
  );
});
