import assert from "node:assert/strict";
import test from "node:test";
import {
  createAuthCookieOptions,
  createClearAuthCookieOptions,
  getAuthCookieName,
} from "../src/config/auth-cookie.js";

test("la cookie de desarrollo es HttpOnly, Lax y no Secure", () => {
  const options = createAuthCookieOptions({
    NODE_ENV: "development",
    AUTH_COOKIE_MAX_AGE_MS: "86400000",
  });

  assert.deepEqual(options, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 86400000,
    path: "/",
  });
});

test("la cookie de producción permite credenciales entre dominios HTTPS", () => {
  const options = createAuthCookieOptions({ NODE_ENV: "production" });

  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, "none");
});

test("las opciones para borrar la cookie conservan sus atributos sin maxAge", () => {
  const options = createClearAuthCookieOptions({ NODE_ENV: "production" });

  assert.deepEqual(options, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
});

test("el nombre de la cookie puede configurarse por entorno", () => {
  assert.equal(getAuthCookieName({ AUTH_COOKIE_NAME: "session" }), "session");
  assert.equal(getAuthCookieName({}), "authToken");
});
