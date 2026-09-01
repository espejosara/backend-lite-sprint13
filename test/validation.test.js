import assert from "node:assert/strict";
import test from "node:test";
import { parsePositiveInteger } from "../src/lib/validation.js";

test("parsePositiveInteger acepta enteros positivos y strings numéricos", () => {
  assert.equal(parsePositiveInteger(4), 4);
  assert.equal(parsePositiveInteger("12"), 12);
});

test("parsePositiveInteger rechaza valores vacíos, negativos y decimales", () => {
  for (const value of [undefined, null, "", 0, -1, 1.5, "texto"]) {
    assert.equal(parsePositiveInteger(value), null);
  }
});
