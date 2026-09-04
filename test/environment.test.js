import assert from "node:assert/strict";
import test from "node:test";
import {
  REQUIRED_PRODUCTION_VARIABLES,
  validateEnvironment,
} from "../src/config/environment.js";

const validProductionEnvironment = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://user:password@db.example.com:5432/app",
  DIRECT_URL: "postgresql://user:password@db.example.com:5432/app",
  JWT_SECRET: "a-secure-secret-with-more-than-32-characters",
  FRONTEND_URL: "https://shop.example.com",
  CLOUDINARY_CLOUD_NAME: "demo",
  CLOUDINARY_API_KEY: "key",
  CLOUDINARY_API_SECRET: "secret",
  STRIPE_SECRET_KEY: "sk_test_example",
  STRIPE_WEBHOOK_SECRET: "whsec_example",
};

test("validateEnvironment no exige integraciones durante desarrollo", () => {
  assert.doesNotThrow(() => validateEnvironment({ NODE_ENV: "development" }));
});

test("validateEnvironment exige todas las variables de producción", () => {
  assert.throws(
    () => validateEnvironment({ NODE_ENV: "production" }),
    (error) => REQUIRED_PRODUCTION_VARIABLES.every(
      (variableName) => error.message.includes(variableName),
    ),
  );
});

test("validateEnvironment valida URLs HTTPS y la fortaleza del JWT", () => {
  assert.doesNotThrow(() => validateEnvironment(validProductionEnvironment));
  assert.throws(
    () => validateEnvironment({
      ...validProductionEnvironment,
      FRONTEND_URL: "http://shop.example.com",
    }),
    /FRONTEND_URL usa un protocolo no permitido/,
  );
  assert.throws(
    () => validateEnvironment({
      ...validProductionEnvironment,
      JWT_SECRET: "demasiado-corto",
    }),
    /JWT_SECRET debe tener al menos 32 caracteres/,
  );
});
