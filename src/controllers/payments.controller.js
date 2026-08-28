import { createCheckoutSession } from "../services/payments.service.js";

export async function startCheckout(req, res, next) {
  try {
    const checkoutSession = await createCheckoutSession(req.user);

    return res.status(201).json({
      ok: true,
      data: checkoutSession,
    });
  } catch (error) {
    return next(error);
  }
}

