import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcryptjs";
import { loginUser, registerUser } from "../src/services/auth.service.js";

const baseUser = {
  id: 1,
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "user",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

function createAuthDb({ foundUser = null } = {}) {
  let createdData = null;

  return {
    db: {
      user: {
        findUnique: async () => foundUser,
        create: async ({ data }) => {
          createdData = data;
          return { ...baseUser, ...data };
        },
      },
    },
    getCreatedData: () => createdData,
  };
}

test("registerUser guarda un hash bcrypt y no devuelve la contraseña", async () => {
  const { db, getCreatedData } = createAuthDb();

  const result = await registerUser(
    { name: " Ada Lovelace ", email: " ADA@EXAMPLE.COM ", password: "secret123" },
    db,
  );

  const savedPassword = getCreatedData().password;

  assert.notEqual(savedPassword, "secret123");
  assert.equal(await bcrypt.compare("secret123", savedPassword), true);
  assert.equal(result.user.email, "ada@example.com");
  assert.equal("password" in result.user, false);
  assert.equal(typeof result.token, "string");
});

test("registerUser rechaza emails inválidos", async () => {
  const { db } = createAuthDb();

  await assert.rejects(
    () => registerUser({ name: "Ada", email: "correo-invalido", password: "secret123" }, db),
    (error) => error.status === 400 && error.message === "Formato de email inválido",
  );
});

test("registerUser rechaza contraseñas demasiado cortas", async () => {
  const { db } = createAuthDb();

  await assert.rejects(
    () => registerUser({ name: "Ada", email: "ada@example.com", password: "12345" }, db),
    (error) => error.status === 400 && error.message.includes("al menos 6"),
  );
});

test("registerUser rechaza un email ya registrado", async () => {
  const { db } = createAuthDb({ foundUser: baseUser });

  await assert.rejects(
    () => registerUser({ name: "Ada", email: "ada@example.com", password: "secret123" }, db),
    (error) => error.status === 409 && error.message === "El email ya está registrado",
  );
});

test("loginUser acepta una contraseña correcta", async () => {
  const password = "secret123";
  const passwordHash = await bcrypt.hash(password, 10);
  const { db } = createAuthDb({ foundUser: { ...baseUser, password: passwordHash } });

  const result = await loginUser({ email: "ADA@EXAMPLE.COM", password }, db);

  assert.equal(result.user.email, "ada@example.com");
  assert.equal("password" in result.user, false);
  assert.equal(typeof result.token, "string");
});

test("loginUser devuelve el mismo error para usuario inexistente y contraseña incorrecta", async () => {
  const passwordHash = await bcrypt.hash("secret123", 10);
  const attempts = [
    createAuthDb().db,
    createAuthDb({ foundUser: { ...baseUser, password: passwordHash } }).db,
  ];

  for (const [index, db] of attempts.entries()) {
    await assert.rejects(
      () => loginUser({ email: "ada@example.com", password: `incorrecta-${index}` }, db),
      (error) => error.status === 401 && error.message === "Credenciales inválidas",
    );
  }
});
