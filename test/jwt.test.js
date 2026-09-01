import assert from "node:assert/strict";
import test from "node:test";
import { getJwtSecret } from "../src/lib/jwt.js";

test("getJwtSecret exige un secreto explícito en producción", () => {
  assert.throws(
    () => getJwtSecret({ NODE_ENV: "production" }),
    /JWT_SECRET es obligatoria en producción/,
  );
});

test("getJwtSecret permite un secreto de desarrollo fuera de producción", () => {
  assert.equal(getJwtSecret({ NODE_ENV: "test" }), "dev-secret-change-me");
  assert.equal(
    getJwtSecret({ NODE_ENV: "production", JWT_SECRET: "secreto-seguro" }),
    "secreto-seguro",
  );
});
