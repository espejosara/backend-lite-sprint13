import assert from "node:assert/strict";
import test from "node:test";
import { logout } from "../src/controllers/auth.controller.js";

test("logout elimina la cookie de autenticación", () => {
  const response = {
    cookieName: null,
    cookieOptions: null,
    body: null,
    clearCookie(name, options) {
      this.cookieName = name;
      this.cookieOptions = options;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  logout({}, response);

  assert.equal(response.cookieName, "authToken");
  assert.deepEqual(response.cookieOptions, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });
  assert.equal(response.body.success, true);
});
