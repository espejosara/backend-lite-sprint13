const CORS_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const CORS_ALLOWED_HEADERS = ["Content-Type"];
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

function toOrigin(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

function getConfiguredOrigins(environment) {
  const values = [
    environment.FRONTEND_URL,
    ...(environment.ALLOWED_ORIGINS?.split(",") ?? []),
  ];

  return new Set(values.map(toOrigin).filter(Boolean));
}

function isLocalOrigin(url) {
  const isHttp = url.protocol === "http:" || url.protocol === "https:";
  return isHttp && LOCAL_HOSTNAMES.has(url.hostname);
}

export function createCorsOptions(environment = process.env) {
  const configuredOrigins = getConfiguredOrigins(environment);

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      let parsedOrigin;

      try {
        parsedOrigin = new URL(origin);
      } catch {
        const error = new Error("Origen no válido");
        error.status = 403;
        callback(error);
        return;
      }

      const isAllowed = configuredOrigins.has(parsedOrigin.origin)
        || isLocalOrigin(parsedOrigin);

      if (isAllowed) {
        callback(null, true);
        return;
      }

      const error = new Error("No permitido por CORS");
      error.status = 403;
      callback(error);
    },
    credentials: true,
    methods: CORS_METHODS,
    allowedHeaders: CORS_ALLOWED_HEADERS,
    optionsSuccessStatus: 204,
  };
}

export const corsOptions = createCorsOptions();
