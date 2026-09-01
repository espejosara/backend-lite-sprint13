const DEFAULT_COOKIE_NAME = "authToken";
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function parsePositiveInteger(value, fallback) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

export function getAuthCookieName(environment = process.env) {
  return environment.AUTH_COOKIE_NAME?.trim() || DEFAULT_COOKIE_NAME;
}

export function createAuthCookieOptions(environment = process.env) {
  const isProduction = environment.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: parsePositiveInteger(
      environment.AUTH_COOKIE_MAX_AGE_MS,
      DEFAULT_MAX_AGE_MS,
    ),
    path: "/",
  };
}

export function createClearAuthCookieOptions(environment = process.env) {
  const { maxAge, ...options } = createAuthCookieOptions(environment);
  return options;
}
