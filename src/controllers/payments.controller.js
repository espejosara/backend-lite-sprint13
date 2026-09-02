import {
  createCheckoutSession,
  getCheckoutOrder,
} from "../services/payments.service.js";
import {
  processStripeEvent,
  verifyStripeWebhook,
} from "../services/stripe-webhook.service.js";

export async function startCheckout(req, res, next) {
  try {
    const checkoutSession = await createCheckoutSession(req.user);

    return res.status(201).json({
      success: true,
      data: checkoutSession,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCheckoutConfirmation(req, res, next) {
  try {
    const order = await getCheckoutOrder({
      sessionId: req.params.sessionId,
      userId: req.user.id,
    });

    return res.status(order ? 200 : 202).json({
      success: true,
      data: {
        confirmed: Boolean(order),
        order,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function stripeWebhook(req, res, next) {
  try {
    const event = verifyStripeWebhook(
      req.body,
      req.headers["stripe-signature"],
    );
    const result = await processStripeEvent(event);

    return res.json({
      received: true,
      processed: ["created", "already_processed"].includes(result.status),
    });
  } catch (error) {
    return next(error);
  }
}
