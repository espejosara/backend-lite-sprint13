import assert from "node:assert/strict";
import test from "node:test";
import { errorHandler } from "../src/middlewares/error.middleware.js";

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("errorHandler conserva mensajes operativos del cliente", () => {
  const response = createResponse();
  const error = new Error("Datos no válidos");
  error.status = 400;

  errorHandler(error, {}, response, () => {});

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Datos no válidos");
});

test("errorHandler oculta detalles internos en producción", (t) => {
  const previousEnvironment = process.env.NODE_ENV;
  const originalConsoleError = console.error;
  t.after(() => {
    process.env.NODE_ENV = previousEnvironment;
    console.error = originalConsoleError;
  });
  process.env.NODE_ENV = "production";
  console.error = () => {};
  const response = createResponse();

  errorHandler(new Error("detalle sensible"), {}, response, () => {});

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.error, "Error interno del servidor");
});
