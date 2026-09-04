import assert from "node:assert/strict";
import test from "node:test";
import { createHealthController } from "../src/controllers/health.controller.js";

function createResponse() {
  return {
    body: null,
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("health devuelve ok cuando PostgreSQL responde", async () => {
  let queryReceived = false;
  const db = {
    async $queryRaw(strings) {
      queryReceived = strings[0] === "SELECT 1";
      return [{ "?column?": 1 }];
    },
  };
  const response = createResponse();

  await createHealthController(db)({}, response, () => {});

  assert.equal(queryReceived, true);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.status, "ok");
  assert.equal(Number.isNaN(Date.parse(response.body.data.timestamp)), false);
});

test("health entrega un 503 al middleware si PostgreSQL falla", async () => {
  const cause = new Error("connection refused");
  const db = {
    async $queryRaw() {
      throw cause;
    },
  };
  let receivedError = null;

  await createHealthController(db)(
    {},
    createResponse(),
    (error) => {
      receivedError = error;
    },
  );

  assert.equal(receivedError.status, 503);
  assert.equal(receivedError.message, "La base de datos no está disponible");
  assert.equal(receivedError.cause, cause);
});
