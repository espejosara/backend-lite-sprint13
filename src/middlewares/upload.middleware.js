import multer from "multer";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const createUploadError = (message) => {
  const error = new Error(message);
  error.status = 400;
  return error;
};

const imageFileFilter = (req, file, callback) => {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    return callback(
      createUploadError("Formato de imagen no permitido. Usa JPG, PNG, WebP, GIF o AVIF"),
    );
  }

  return callback(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter: imageFileFilter,
});

const parseProductImage = (req, res, next) => {
  return upload.single("image")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      error.status = 400;

      if (error.code === "LIMIT_FILE_SIZE") {
        error.message = "La imagen no puede superar los 5 MB";
      } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
        error.message = "Solo se admite un archivo en el campo image";
      }
    }

    if (!error.status) {
      error.status = 400;
    }

    return next(error);
  });
};

export {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  imageFileFilter,
  parseProductImage,
  upload,
};
