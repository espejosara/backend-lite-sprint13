const REQUIRED_PRODUCTION_VARIABLES = [
  "DATABASE_URL",
  "DIRECT_URL",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function assertValidUrl(value, variableName, protocols) {
  let parsedUrl;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${variableName} debe ser una URL válida`);
  }

  if (!protocols.includes(parsedUrl.protocol)) {
    throw new Error(`${variableName} usa un protocolo no permitido`);
  }
}

export function validateEnvironment(environment = process.env) {
  if (environment.NODE_ENV !== "production") {
    return;
  }

  const missingVariables = REQUIRED_PRODUCTION_VARIABLES.filter(
    (variableName) => !hasValue(environment[variableName]),
  );
  const frontendUrl = environment.FRONTEND_URL || environment.CLIENT_URL;

  if (!hasValue(frontendUrl)) {
    missingVariables.push("FRONTEND_URL (o CLIENT_URL)");
  }

  if (missingVariables.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missingVariables.join(", ")}`,
    );
  }

  assertValidUrl(
    environment.DATABASE_URL,
    "DATABASE_URL",
    ["postgresql:", "postgres:"],
  );
  assertValidUrl(
    environment.DIRECT_URL,
    "DIRECT_URL",
    ["postgresql:", "postgres:"],
  );
  assertValidUrl(frontendUrl, "FRONTEND_URL", ["https:"]);

  if (environment.JWT_SECRET.trim().length < 32) {
    throw new Error("JWT_SECRET debe tener al menos 32 caracteres en producción");
  }
}

export { REQUIRED_PRODUCTION_VARIABLES };
