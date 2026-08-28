import assert from "node:assert/strict";
import test from "node:test";
import { signToken } from "../src/lib/jwt.js";
import { authenticateToken, requireRole } from "../src/middlewares/auth.middleware.js";

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("authenticateToken rechaza peticiones sin cookie", () => {
  const req = { cookies: {} };
  const res = createResponse();
  let nextCalled = false;

  authenticateToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, "Sesión no iniciada");
  assert.equal(nextCalled, false);
});

test("authenticateToken rechaza tokens inválidos", () => {
  const req = { cookies: { authToken: "token-invalido" } };
  const res = createResponse();

  authenticateToken(req, res, () => assert.fail("next no debe ejecutarse"));

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, "Token inválido o expirado");
});

test("authenticateToken añade el usuario de una cookie válida", () => {
  const token = signToken({ id: 7, email: "admin@example.com", role: "admin" });
  const req = { cookies: { authToken: token } };
  const res = createResponse();
  let nextCalled = false;

  authenticateToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 7);
  assert.equal(req.user.role, "admin");
});

test("requireRole devuelve 401 si no hay usuario autenticado", () => {
  const res = createResponse();

  requireRole("admin")({}, res, () => assert.fail("next no debe ejecutarse"));

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, "Usuario no autenticado");
});

test("requireRole impide a un usuario normal acceder como admin", () => {
  const res = createResponse();

  requireRole("admin")(
    { user: { id: 2, role: "user" } },
    res,
    () => assert.fail("next no debe ejecutarse"),
  );

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, "No tienes permisos para acceder a este recurso");
});

test("requireRole permite el acceso a un administrador", () => {
  const res = createResponse();
  let nextCalled = false;

  requireRole("admin")({ user: { id: 1, role: "admin" } }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});
