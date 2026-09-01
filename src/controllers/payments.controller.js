import { createCheckoutSession } from "../services/payments.service.js";
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
