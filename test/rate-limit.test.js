import assert from "node:assert/strict";
import test from "node:test";
import { createAuthRateLimitOptions } from "../src/config/rate-limit.js";

test("el límite de autenticación usa valores seguros por defecto", () => {
  const options = createAuthRateLimitOptions({});

  assert.equal(options.windowMs, 900000);
  assert.equal(options.limit, 10);
  assert.equal(options.skipSuccessfulRequests, true);
  assert.equal(options.legacyHeaders, false);
});

test("el límite de autenticación admite valores configurados", () => {
  const options = createAuthRateLimitOptions({
    AUTH_RATE_LIMIT_WINDOW_MS: "60000",
    AUTH_RATE_LIMIT_MAX: "5",
  });

  assert.equal(options.windowMs, 60000);
  assert.equal(options.limit, 5);
});
