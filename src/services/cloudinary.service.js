import cloudinary, {
  getMissingCloudinaryVariables,
} from "../config/cloudinary.js";

const createServiceError = (status, message, cause) => {
  const error = new Error(message, cause ? { cause } : undefined);
  error.status = status;
  return error;
};

const uploadProductImage = async (buffer, client = cloudinary) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw createServiceError(400, "La imagen del producto está vacía");
  }

  if (client === cloudinary) {
    const missingVariables = getMissingCloudinaryVariables();

    if (missingVariables.length > 0) {
      throw createServiceError(
        503,
        `Cloudinary no está configurado. Faltan: ${missingVariables.join(", ")}`,
      );
    }
  }

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: "products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(
            createServiceError(502, "No se pudo subir la imagen a Cloudinary", error),
          );
        }

        if (!result?.secure_url) {
          return reject(
            createServiceError(502, "Cloudinary no devolvió una URL segura para la imagen"),
          );
        }

        return resolve(result);
      },
    );

    stream.on("error", (error) => {
      reject(createServiceError(502, "No se pudo enviar la imagen a Cloudinary", error));
    });

    stream.end(buffer);
  });
};

export { uploadProductImage };
