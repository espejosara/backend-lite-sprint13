import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import { uploadProductImage } from "../src/services/cloudinary.service.js";

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
