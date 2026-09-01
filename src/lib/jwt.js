import jwt from "jsonwebtoken";

const DEVELOPMENT_JWT_SECRET = "dev-secret-change-me";

export function getJwtSecret(environment = process.env) {
  const configuredSecret = environment.JWT_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (environment.NODE_ENV === "production") {
    throw new Error("JWT_SECRET es obligatoria en producción");
  }

  return DEVELOPMENT_JWT_SECRET;
}

const JWT_SECRET = getJwtSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export { signToken, verifyToken };
