import assert from "node:assert/strict";
import test from "node:test";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  imageFileFilter,
} from "../src/middlewares/upload.middleware.js";

test("la subida usa un límite de 5 MB", () => {
  assert.equal(MAX_IMAGE_SIZE_BYTES, 5 * 1024 * 1024);
});

test("imageFileFilter acepta los formatos de imagen permitidos", () => {
  for (const mimetype of ALLOWED_IMAGE_TYPES) {
    imageFileFilter({}, { mimetype }, (error, accepted) => {
      assert.equal(error, null);
      assert.equal(accepted, true);
    });
  }
});

test("imageFileFilter rechaza archivos que no son imágenes permitidas", () => {
  imageFileFilter({}, { mimetype: "application/pdf" }, (error) => {
    assert.equal(error.status, 400);
    assert.match(error.message, /Formato de imagen no permitido/);
  });
});
