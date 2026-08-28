import Stripe from "stripe";

let stripeClient;

export function getStripeClient(environment = process.env) {
  const secretKey = environment.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    const error = new Error("STRIPE_SECRET_KEY no está configurada");
    error.status = 500;
    throw error;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

