import { rateLimit } from "express-rate-limit";

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 10;

function parsePositiveInteger(value, fallback) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

export function createAuthRateLimitOptions(environment = process.env) {
  return {
    windowMs: parsePositiveInteger(
      environment.AUTH_RATE_LIMIT_WINDOW_MS,
      DEFAULT_WINDOW_MS,
    ),
    limit: parsePositiveInteger(
      environment.AUTH_RATE_LIMIT_MAX,
      DEFAULT_MAX_ATTEMPTS,
    ),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
      success: false,
      error: "Demasiados intentos. Inténtalo de nuevo más tarde",
    },
  };
}

export const authRateLimiter = rateLimit(createAuthRateLimitOptions());

