import cloudinary, {
  getMissingCloudinaryVariables,
} from "../config/cloudinary.js";

const PRODUCT_IMAGE_FOLDER = "products";

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
        folder: PRODUCT_IMAGE_FOLDER,
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

function getProductImagePublicId(imageUrl, environment = process.env) {
  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    return null;
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return null;
  }

  const cloudName = environment.CLOUDINARY_CLOUD_NAME?.trim();
  const segments = parsedUrl.pathname.split("/").filter(Boolean);
  const uploadSegmentIndex = segments.findIndex(
    (segment, index) => segment === "upload" && segments[index - 1] === "image",
  );

  if (
    parsedUrl.protocol !== "https:"
    || parsedUrl.hostname !== "res.cloudinary.com"
    || !cloudName
    || segments[0] !== cloudName
    || uploadSegmentIndex === -1
  ) {
    return null;
  }

  const publicIdSegments = segments.slice(uploadSegmentIndex + 1);

  if (/^v\d+$/.test(publicIdSegments[0])) {
    publicIdSegments.shift();
  }

  const encodedPublicId = publicIdSegments.join("/");
  let publicId;

  try {
    publicId = decodeURIComponent(encodedPublicId).replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }

  return publicId.startsWith(`${PRODUCT_IMAGE_FOLDER}/`) ? publicId : null;
}

async function deleteProductImage(publicId, client = cloudinary) {
  if (
    typeof publicId !== "string"
    || !publicId.startsWith(`${PRODUCT_IMAGE_FOLDER}/`)
  ) {
    return { result: "skipped" };
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

  try {
    return await client.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "image",
    });
  } catch (cause) {
    throw createServiceError(502, "No se pudo eliminar la imagen de Cloudinary", cause);
  }
}

export {
  deleteProductImage,
  getProductImagePublicId,
  PRODUCT_IMAGE_FOLDER,
  uploadProductImage,
};
