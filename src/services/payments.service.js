import prisma from "../lib/prisma.js";
import { getStripeClient } from "../lib/stripe.js";
import { formatOrderWithProducts } from "./orders.service.js";

const DEFAULT_FRONTEND_URL = "http://localhost:5173";
const DEFAULT_CURRENCY = "eur";
const MAX_CHECKOUT_LINE_ITEMS = 100;

function createServiceError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getFrontendUrl(environment) {
  const configuredUrl = environment.FRONTEND_URL
    || environment.CLIENT_URL
    || DEFAULT_FRONTEND_URL;

  try {
    return new URL(configuredUrl).origin;
  } catch {
    throw createServiceError(500, "FRONTEND_URL no es una URL válida");
  }
}

function getCurrency(environment) {
  const currency = (environment.STRIPE_CURRENCY || DEFAULT_CURRENCY).toLowerCase();

  if (!/^[a-z]{3}$/.test(currency)) {
    throw createServiceError(500, "STRIPE_CURRENCY no es válida");
  }

  return currency;
}

function normalizeCheckoutSessionId(sessionId) {
  const normalizedSessionId = typeof sessionId === "string"
    ? sessionId.trim()
    : "";

  if (
    normalizedSessionId.length > 255
    || !/^cs_[A-Za-z0-9_]+$/.test(normalizedSessionId)
  ) {
    throw createServiceError(400, "session_id de Stripe no válido");
  }

  return normalizedSessionId;
}

export function priceToMinorUnits(price) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    throw createServiceError(500, "Hay un producto con un precio no válido");
  }

  const minorUnits = Math.round((numericPrice + Number.EPSILON) * 100);

  if (!Number.isSafeInteger(minorUnits)) {
    throw createServiceError(500, "Hay un producto con un precio fuera de rango");
  }

  return minorUnits;
}

export function buildStripeLineItems(items, currency = DEFAULT_CURRENCY) {
  return items.map((item) => {
    const productData = {
      name: item.product.name,
      metadata: {
        productId: String(item.productId),
      },
    };

    if (item.product.description) {
      productData.description = item.product.description.slice(0, 500);
    }

    if (item.product.imageUrl?.startsWith("https://")) {
      productData.images = [item.product.imageUrl];
    }

    return {
      price_data: {
        currency,
        unit_amount: priceToMinorUnits(item.product.price),
        product_data: productData,
      },
      quantity: item.quantity,
    };
  });
}

export async function createCheckoutSession(
  user,
  {
    db = prisma,
    stripe = getStripeClient(),
    environment = process.env,
  } = {},
) {
  const items = await db.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { productId: "asc" },
  });

  if (items.length === 0) {
    throw createServiceError(400, "El carrito está vacío");
  }

  if (items.length > MAX_CHECKOUT_LINE_ITEMS) {
    throw createServiceError(
      400,
      `Stripe admite un máximo de ${MAX_CHECKOUT_LINE_ITEMS} productos diferentes por pago`,
    );
  }

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw createServiceError(400, "El carrito contiene una cantidad no válida");
    }

    if (item.product.stock < item.quantity) {
      throw createServiceError(
        400,
        `Stock insuficiente para ${item.product.name}. Disponible: ${item.product.stock}`,
      );
    }
  }

  const frontendUrl = getFrontendUrl(environment);
  const lineItems = buildStripeLineItems(items, getCurrency(environment));
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/checkout?canceled=true`,
    client_reference_id: String(user.id),
    customer_email: user.email,
    metadata: {
      userId: String(user.id),
    },
  });

  if (!session.url) {
    throw createServiceError(502, "Stripe no devolvió una URL de pago");
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

export async function getCheckoutOrder(
  { sessionId, userId },
  db = prisma,
) {
  const normalizedSessionId = normalizeCheckoutSessionId(sessionId);
  const order = await db.order.findFirst({
    where: {
      stripeCheckoutSessionId: normalizedSessionId,
      userId,
    },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  return order ? formatOrderWithProducts(order) : null;
}
