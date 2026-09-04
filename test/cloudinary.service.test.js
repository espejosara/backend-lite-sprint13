import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import {
  deleteProductImage,
  getProductImagePublicId,
  uploadProductImage,
} from "../src/services/cloudinary.service.js";

const createCloudinaryClient = ({ error = null, result = null } = {}) => {
  let receivedOptions = null;
  let receivedBuffer = null;

  const client = {
    uploader: {
      upload_stream(options, callback) {
        receivedOptions = options;
        const stream = new EventEmitter();
        stream.end = (buffer) => {
          receivedBuffer = buffer;
          queueMicrotask(() => callback(error, result));
        };
        return stream;
      },
    },
  };

  return {
    client,
    getReceivedBuffer: () => receivedBuffer,
    getReceivedOptions: () => receivedOptions,
  };
};

test("uploadProductImage envía el buffer a la carpeta products", async () => {
  const uploadResult = {
    public_id: "products/figura",
    secure_url: "https://res.cloudinary.com/demo/image/upload/figura.jpg",
  };
  const { client, getReceivedBuffer, getReceivedOptions } = createCloudinaryClient({
    result: uploadResult,
  });
  const buffer = Buffer.from("imagen-de-prueba");

  const result = await uploadProductImage(buffer, client);

  assert.equal(result, uploadResult);
  assert.equal(getReceivedBuffer(), buffer);
  assert.deepEqual(getReceivedOptions(), {
    folder: "products",
    resource_type: "image",
  });
});

test("uploadProductImage rechaza buffers vacíos", async () => {
  const { client } = createCloudinaryClient();

  await assert.rejects(
    () => uploadProductImage(Buffer.alloc(0), client),
    (error) => error.status === 400 && error.message === "La imagen del producto está vacía",
  );
});

test("uploadProductImage convierte errores de Cloudinary en un error 502", async () => {
  const { client } = createCloudinaryClient({ error: new Error("Credenciales inválidas") });

  await assert.rejects(
    () => uploadProductImage(Buffer.from("imagen"), client),
    (error) => (
      error.status === 502
      && error.message === "No se pudo subir la imagen a Cloudinary"
      && error.cause?.message === "Credenciales inválidas"
    ),
  );
});

test("getProductImagePublicId extrae únicamente imágenes de products de la cuenta", () => {
  const environment = { CLOUDINARY_CLOUD_NAME: "demo" };

  assert.equal(
    getProductImagePublicId(
      "https://res.cloudinary.com/demo/image/upload/v123/products/figura.webp",
      environment,
    ),
    "products/figura",
  );
  assert.equal(
    getProductImagePublicId(
      "https://res.cloudinary.com/otra/image/upload/v123/products/figura.webp",
      environment,
    ),
    null,
  );
  assert.equal(
    getProductImagePublicId(
      "https://res.cloudinary.com/demo/image/upload/v123/avatars/admin.webp",
      environment,
    ),
    null,
  );
});

test("deleteProductImage invalida la imagen eliminada", async () => {
  let destroyArguments = null;
  const client = {
    uploader: {
      async destroy(...args) {
        destroyArguments = args;
        return { result: "ok" };
      },
    },
  };

  const result = await deleteProductImage("products/figura", client);

  assert.deepEqual(destroyArguments, ["products/figura", {
    invalidate: true,
    resource_type: "image",
  }]);
  assert.deepEqual(result, { result: "ok" });
});

test("deleteProductImage no elimina recursos fuera de products", async () => {
  let destroyCalled = false;
  const client = {
    uploader: {
      async destroy() {
        destroyCalled = true;
      },
    },
  };

  assert.deepEqual(await deleteProductImage("avatars/admin", client), {
    result: "skipped",
  });
  assert.equal(destroyCalled, false);
});
