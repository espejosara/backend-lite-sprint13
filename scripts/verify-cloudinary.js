import "dotenv/config";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import app from "../src/app.js";
import cloudinary from "../src/config/cloudinary.js";
import { signToken } from "../src/lib/jwt.js";
import prisma from "../src/lib/prisma.js";

const TEST_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const getCloudinaryPublicId = (imageUrl) => {
  const segments = new URL(imageUrl).pathname.split("/").filter(Boolean);
  const uploadIndex = segments.indexOf("upload");

  if (uploadIndex === -1) {
    return null;
  }

  const pathSegments = segments.slice(uploadIndex + 1);

  if (/^v\d+$/.test(pathSegments[0])) {
    pathSegments.shift();
  }

  const publicIdWithExtension = pathSegments.join("/");
  return publicIdWithExtension.replace(/\.[^/.]+$/, "");
};

const runVerification = async () => {
  const suffix = randomUUID();
  const token = signToken({
    id: -1,
    email: "cloudinary-verification@local.invalid",
    role: "admin",
  });
  let productId = null;
  let cloudinaryPublicId = null;
  let server = null;

  try {
    server = app.listen(0);
    await once(server, "listening");

    const { port } = server.address();
    const formData = new FormData();
    formData.append("name", `Verificación Cloudinary ${suffix}`);
    formData.append("category", "verification");
    formData.append("description", "Producto temporal para verificar la subida de imágenes");
    formData.append("price", "1.01");
    formData.append("stock", "0");
    formData.append(
      "image",
      new Blob([Buffer.from(TEST_IMAGE_BASE64, "base64")], { type: "image/png" }),
      "cloudinary-verification.png",
    );

    const createResponse = await fetch(`http://127.0.0.1:${port}/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const createBody = await createResponse.json();

    assert.equal(
      createResponse.status,
      201,
      `La API respondió ${createResponse.status}: ${createBody.error || "error desconocido"}`,
    );
    assert.equal(createBody.success, true);
    assert.match(createBody.data.imageUrl, /^https:\/\//);

    productId = createBody.data.id;
    cloudinaryPublicId = getCloudinaryPublicId(createBody.data.imageUrl);

    const storedProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    assert.ok(storedProduct, "El producto no se guardó en la base de datos");
    assert.equal(storedProduct.imageUrl, createBody.data.imageUrl);
    assert.ok(cloudinaryPublicId, "No se pudo identificar el recurso temporal de Cloudinary");

    const deleteResponse = await fetch(`http://127.0.0.1:${port}/products/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(deleteResponse.status, 200, "No se pudo eliminar el producto temporal");
    productId = null;

    console.log("Verificación completa: multipart, Cloudinary y PostgreSQL funcionan correctamente.");
  } finally {
    if (productId !== null) {
      await prisma.product.delete({ where: { id: productId } }).catch(() => {});
    }

    if (cloudinaryPublicId) {
      await cloudinary.uploader.destroy(cloudinaryPublicId, {
        invalidate: true,
        resource_type: "image",
      });
    }

    if (server) {
      server.close();
      await once(server, "close");
    }

    await prisma.$disconnect();
  }
};

runVerification().catch((error) => {
  console.error(`Verificación fallida: ${error.message}`);
  process.exitCode = 1;
});
