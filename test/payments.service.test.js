import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStripeLineItems,
  createCheckoutSession,
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
