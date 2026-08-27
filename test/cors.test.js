import assert from "node:assert/strict";
import test from "node:test";
import { createCorsOptions } from "../src/config/cors.js";

function evaluateOrigin(options, origin) {
  return new Promise((resolve) => {
    options.origin(origin, (error, allowed) => {
      resolve({ error, allowed });
    });
  });
}

test("CORS permite peticiones sin origen como Postman o tests", async () => {
  const options = createCorsOptions({});
  const result = await evaluateOrigin(options, undefined);

  assert.equal(result.error, null);
  assert.equal(result.allowed, true);
});

test("CORS permite localhost y loopback con distintos puertos", async () => {
  const options = createCorsOptions({});
  const origins = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://[::1]:5173",
  ];

  for (const origin of origins) {
    const result = await evaluateOrigin(options, origin);
    assert.equal(result.error, null);
    assert.equal(result.allowed, true);
  }
});

test("CORS permite sitios y previews de Netlify por HTTPS", async () => {
  const options = createCorsOptions({});
  const origins = [
    "https://mi-tienda.netlify.app",
    "https://deploy-preview-42--mi-tienda.netlify.app",
  ];

  for (const origin of origins) {
    const result = await evaluateOrigin(options, origin);
    assert.equal(result.error, null);
    assert.equal(result.allowed, true);
  }
});

test("CORS no acepta dominios que imitan el sufijo de Netlify", async () => {
  const options = createCorsOptions({});
  const origins = [
    "https://netlify.app.ejemplo.com",
    "https://falso-netlify.app",
    "http://mi-tienda.netlify.app",
  ];

  for (const origin of origins) {
    const result = await evaluateOrigin(options, origin);
    assert.equal(result.allowed, undefined);
    assert.equal(result.error?.message, "No permitido por CORS");
  }
});

test("CORS permite orígenes exactos configurados por entorno", async () => {
  const options = createCorsOptions({
    FRONTEND_URL: "https://tienda.example.com/",
    ALLOWED_ORIGINS: "https://admin.example.com, https://preview.example.com",
  });

  for (const origin of [
    "https://tienda.example.com",
    "https://admin.example.com",
    "https://preview.example.com",
  ]) {
    const result = await evaluateOrigin(options, origin);
    assert.equal(result.error, null);
    assert.equal(result.allowed, true);
  }
});

test("CORS configura credenciales, métodos, cabeceras y preflight", () => {
  const options = createCorsOptions({});

  assert.equal(options.credentials, true);
  assert.deepEqual(options.methods, ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
  assert.deepEqual(options.allowedHeaders, ["Content-Type", "Authorization"]);
  assert.equal(options.optionsSuccessStatus, 204);
});
