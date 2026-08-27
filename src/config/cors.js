const CORS_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const CORS_ALLOWED_HEADERS = ["Content-Type", "Authorization"];
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

function isNetlifyOrigin(url) {
  return url.protocol === "https:" && url.hostname.endsWith(".netlify.app");
}

export function createCorsOptions(environment = process.env) {
  const configuredOrigins = getConfiguredOrigins(environment);
  const allowAllOrigins = environment.ALLOW_ALL_ORIGINS === "true";

  return {
    origin(origin, callback) {
      if (!origin || allowAllOrigins) {
        callback(null, true);
        return;
      }

      let parsedOrigin;

      try {
        parsedOrigin = new URL(origin);
      } catch {
        callback(new Error("Origen no válido"));
        return;
      }

      const isAllowed = configuredOrigins.has(parsedOrigin.origin)
        || isLocalOrigin(parsedOrigin)
        || isNetlifyOrigin(parsedOrigin);

      if (isAllowed) {
        callback(null, true);
        return;
      }

      callback(new Error("No permitido por CORS"));
    },
    credentials: true,
    methods: CORS_METHODS,
    allowedHeaders: CORS_ALLOWED_HEADERS,
    optionsSuccessStatus: 204,
  };
}

export const corsOptions = createCorsOptions();
