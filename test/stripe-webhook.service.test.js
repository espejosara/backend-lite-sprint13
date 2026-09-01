import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import {
  fulfillCheckoutSession,
  processStripeEvent,
  verifyStripeWebhook,
} from "../src/services/stripe-webhook.service.js";

const WEBHOOK_SECRET = "whsec_test_secret";

function createSignedEvent(type = "checkout.session.completed") {
  const stripe = new Stripe("sk_test_unit_tests");
  const payload = JSON.stringify({
    id: "evt_test_123",
    object: "event",
    type,
    data: {
      object: { id: "cs_test_123" },
    },
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
  });

  return { stripe, payload: Buffer.from(payload), signature };
}

function createFulfillmentDependencies({ stock = 5, paymentStatus = "paid" } = {}) {
  const state = {
    order: null,
    stock,
    cartDeleted: false,
    orderCreates: 0,
    stockUpdates: 0,
    stripeRetrieves: 0,
  };

  const lineItems = {
    data: [
      {
        quantity: 2,
        price: {
          unit_amount: 1999,
          product: {
            metadata: { productId: "3" },
          },
        },
      },
    ],
    has_more: false,
  };

  const order = {
    findUnique: async () => state.order,
    create: async ({ data }) => {
      state.orderCreates += 1;
      state.order = { id: 41, ...data };
      return state.order;
    },
  };

  const transactionClient = {
    order,
    product: {
      updateMany: async ({ where, data }) => {
        state.stockUpdates += 1;

        if (state.stock < where.stock.gte) {
          return { count: 0 };
        }

        state.stock -= data.stock.decrement;
        return { count: 1 };
      },
    },
    cartItem: {
      deleteMany: async () => {
        state.cartDeleted = true;
        return { count: 1 };
      },
    },
  };

  return {
    dependencies: {
      db: {
        order,
        $transaction: async (callback) => callback(transactionClient),
      },
      stripe: {
        checkout: {
          sessions: {
            retrieve: async (sessionId) => {
              state.stripeRetrieves += 1;
              return {
                id: sessionId,
                payment_status: paymentStatus,
                amount_total: 3998,
                client_reference_id: "7",
                metadata: { userId: "7" },
                line_items: lineItems,
              };
            },
            listLineItems: async () => lineItems,
          },
        },
      },
    },
    state,
  };
}

test("verifyStripeWebhook acepta una firma generada con el secreto correcto", () => {
  const { stripe, payload, signature } = createSignedEvent();

  const event = verifyStripeWebhook(payload, signature, {
    stripe,
    environment: { STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET },
  });

  assert.equal(event.id, "evt_test_123");
  assert.equal(event.type, "checkout.session.completed");
});

test("verifyStripeWebhook rechaza una firma incorrecta", () => {
  const { stripe, payload, signature } = createSignedEvent();

  assert.throws(
    () => verifyStripeWebhook(payload, signature, {
      stripe,
      environment: { STRIPE_WEBHOOK_SECRET: "whsec_otro_secreto" },
    }),
    (error) => error.status === 400 && error.message === "Firma de Stripe no válida",
  );
});

test("verifyStripeWebhook exige el Buffer original sin parsear", () => {
  const { stripe, signature } = createSignedEvent();

  assert.throws(
    () => verifyStripeWebhook({}, signature, {
      stripe,
      environment: { STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET },
    }),
    (error) => error.status === 400 && error.message.includes("cuerpo original"),
  );
});

test("fulfillCheckoutSession crea el pedido, descuenta stock y vacía el carrito", async () => {
  const { dependencies, state } = createFulfillmentDependencies();

  const result = await fulfillCheckoutSession("cs_test_123", dependencies);

  assert.equal(result.status, "created");
  assert.equal(result.order.userId, 7);
  assert.equal(result.order.total, "39.98");
  assert.equal(result.order.stripeCheckoutSessionId, "cs_test_123");
  assert.deepEqual(result.order.items.create, [
    { productId: 3, quantity: 2, unitPrice: "19.99" },
  ]);
  assert.equal(state.stock, 3);
  assert.equal(state.cartDeleted, true);
  assert.equal(state.orderCreates, 1);
});

test("fulfillCheckoutSession procesa una sesión repetida una sola vez", async () => {
  const { dependencies, state } = createFulfillmentDependencies();

  const firstResult = await fulfillCheckoutSession("cs_test_123", dependencies);
  const repeatedResult = await fulfillCheckoutSession("cs_test_123", dependencies);

  assert.equal(firstResult.status, "created");
  assert.equal(repeatedResult.status, "already_processed");
  assert.equal(state.orderCreates, 1);
  assert.equal(state.stockUpdates, 1);
  assert.equal(state.stripeRetrieves, 1);
  assert.equal(state.stock, 3);
});

test("fulfillCheckoutSession repite la comprobación de idempotencia dentro de la transacción", async () => {
  const { dependencies, state } = createFulfillmentDependencies();
  let lookupCount = 0;
  const orderCreatedByAnotherRequest = {
    id: 42,
    stripeCheckoutSessionId: "cs_test_concurrent",
  };

  dependencies.db.order.findUnique = async () => {
    lookupCount += 1;
    return lookupCount === 1 ? null : orderCreatedByAnotherRequest;
  };

  const result = await fulfillCheckoutSession(
    "cs_test_concurrent",
    dependencies,
  );

  assert.equal(result.status, "already_processed");
  assert.equal(result.order.id, 42);
  assert.equal(state.orderCreates, 0);
  assert.equal(state.stockUpdates, 0);
  assert.equal(state.cartDeleted, false);
});

test("fulfillCheckoutSession no confirma pagos pendientes", async () => {
  const { dependencies, state } = createFulfillmentDependencies({
    paymentStatus: "unpaid",
  });

  const result = await fulfillCheckoutSession("cs_test_pending", dependencies);

  assert.equal(result.status, "payment_pending");
  assert.equal(state.orderCreates, 0);
  assert.equal(state.stockUpdates, 0);
  assert.equal(state.cartDeleted, false);
});

test("fulfillCheckoutSession cancela la transacción si no queda stock", async () => {
  const { dependencies, state } = createFulfillmentDependencies({ stock: 1 });

  await assert.rejects(
    () => fulfillCheckoutSession("cs_test_no_stock", dependencies),
    (error) => error.status === 409 && error.message.includes("Stock insuficiente"),
  );

  assert.equal(state.orderCreates, 0);
  assert.equal(state.cartDeleted, false);
});

test("processStripeEvent ignora eventos que no confirman un Checkout", async () => {
  const result = await processStripeEvent({
    type: "payment_intent.created",
    data: { object: { id: "pi_test_123" } },
  });

  assert.deepEqual(result, { status: "ignored", order: null });
});
