import prisma from "../lib/prisma.js";
import { getStripeClient } from "../lib/stripe.js";

const PAID_STATUSES = new Set(["paid", "no_payment_required"]);
const PAYMENT_SUCCEEDED_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

function createServiceError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getWebhookSecret(environment) {
  const secret = environment.STRIPE_WEBHOOK_SECRET?.trim();

  if (!secret) {
    throw createServiceError(500, "STRIPE_WEBHOOK_SECRET no está configurada");
  }

  return secret;
}

export function verifyStripeWebhook(
  rawBody,
  signature,
  {
    stripe = getStripeClient(),
    environment = process.env,
  } = {},
) {
  if (!Buffer.isBuffer(rawBody)) {
    throw createServiceError(400, "El webhook necesita el cuerpo original");
  }

  if (typeof signature !== "string" || !signature) {
    throw createServiceError(400, "Falta la firma de Stripe");
  }

  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      getWebhookSecret(environment),
    );
  } catch (error) {
    if (error.status === 500) {
      throw error;
    }

    throw createServiceError(400, "Firma de Stripe no válida");
  }
}

function parsePositiveInteger(value, fieldName) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw createServiceError(400, `${fieldName} no es válido en Stripe`);
  }

  return parsedValue;
}

function minorUnitsToDecimal(amount) {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw createServiceError(400, "El importe de Stripe no es válido");
  }

  return `${Math.floor(amount / 100)}.${String(amount % 100).padStart(2, "0")}`;
}

function getProductId(lineItem) {
  const stripeProduct = lineItem.price?.product;
  const productId = typeof stripeProduct === "object"
    ? stripeProduct.metadata?.productId
    : null;

  return parsePositiveInteger(productId, "productId");
}

export function buildOrderItemsFromStripe(lineItems) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw createServiceError(400, "La sesión de Stripe no contiene productos");
  }

  return lineItems.map((lineItem) => {
    const unitAmount = lineItem.price?.unit_amount;

    if (!Number.isSafeInteger(unitAmount) || unitAmount < 1) {
      throw createServiceError(400, "Stripe devolvió un precio no válido");
    }

    return {
      productId: getProductId(lineItem),
      quantity: parsePositiveInteger(lineItem.quantity, "quantity"),
      unitPrice: minorUnitsToDecimal(unitAmount),
      unitAmount,
    };
  });
}

async function retrieveCheckoutSession(sessionId, stripe) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product"],
  });

  if (!PAID_STATUSES.has(session.payment_status)) {
    return { session, lineItems: [] };
  }

  let lineItems = session.line_items;

  if (!lineItems || lineItems.has_more) {
    lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
      expand: ["data.price.product"],
    });
  }

  return {
    session,
    lineItems: lineItems.data,
  };
}

async function removePurchasedItemsFromCart(tx, userId, orderItems) {
  for (const item of orderItems) {
    const cartItem = await tx.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: item.productId,
        },
      },
    });

    if (!cartItem) {
      continue;
    }

    if (cartItem.quantity > item.quantity) {
      await tx.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: cartItem.quantity - item.quantity },
      });
      continue;
    }

    await tx.cartItem.delete({
      where: { id: cartItem.id },
    });
  }
}

export async function fulfillCheckoutSession(
  sessionId,
  {
    db = prisma,
    stripe = getStripeClient(),
  } = {},
) {
  const existingOrder = await db.order.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
  });

  if (existingOrder) {
    return { status: "already_processed", order: existingOrder };
  }

  const { session, lineItems } = await retrieveCheckoutSession(sessionId, stripe);

  if (!PAID_STATUSES.has(session.payment_status)) {
    return { status: "payment_pending", order: null };
  }

  const userId = parsePositiveInteger(
    session.metadata?.userId || session.client_reference_id,
    "userId",
  );
  const orderItems = buildOrderItemsFromStripe(lineItems);
  const calculatedAmount = orderItems.reduce(
    (total, item) => total + item.unitAmount * item.quantity,
    0,
  );

  if (calculatedAmount !== session.amount_total) {
    throw createServiceError(400, "El total de Stripe no coincide con sus productos");
  }

  try {
    return await db.$transaction(async (tx) => {
      const orderProcessedInsideTransaction = await tx.order.findUnique({
        where: { stripeCheckoutSessionId: session.id },
      });

      if (orderProcessedInsideTransaction) {
        return {
          status: "already_processed",
          order: orderProcessedInsideTransaction,
        };
      }

      for (const item of orderItems) {
        const updatedProduct = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (updatedProduct.count === 0) {
          throw createServiceError(
            409,
            `Stock insuficiente para confirmar el producto ${item.productId}`,
          );
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          total: minorUnitsToDecimal(session.amount_total),
          stripeCheckoutSessionId: session.id,
          paidAt: new Date(),
          items: {
            create: orderItems.map(({ unitAmount, ...item }) => item),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      await removePurchasedItemsFromCart(tx, userId, orderItems);

      return { status: "created", order };
    });
  } catch (error) {
    if (error.code !== "P2002") {
      throw error;
    }

    const concurrentlyCreatedOrder = await db.order.findUnique({
      where: { stripeCheckoutSessionId: session.id },
    });

    if (!concurrentlyCreatedOrder) {
      throw error;
    }

    return { status: "already_processed", order: concurrentlyCreatedOrder };
  }
}

export async function processStripeEvent(event, dependencies) {
  if (!PAYMENT_SUCCEEDED_EVENTS.has(event.type)) {
    return { status: "ignored", order: null };
  }

  return fulfillCheckoutSession(event.data.object.id, dependencies);
}
