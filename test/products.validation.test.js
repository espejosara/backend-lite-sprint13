import assert from "node:assert/strict";
import test from "node:test";
import { validateProductPayload } from "../src/controllers/products.controller.js";

const validProduct = {
  name: " Figura de prueba ",
  category: " accion ",
  description: " Producto para tests ",
  price: "24.99",
  stock: "5",
  imageUrl: " https://example.com/product.png ",
};

test("validateProductPayload normaliza un producto válido", () => {
  const result = validateProductPayload(validProduct);

  assert.deepEqual(result.data, {
    name: "Figura de prueba",
    category: "accion",
    description: "Producto para tests",
    price: 24.99,
    stock: 5,
    imageUrl: "https://example.com/product.png",
  });
});

test("validateProductPayload exige los campos obligatorios", () => {
  assert.equal(validateProductPayload({}).error, "El nombre del producto es obligatorio");
});

test("validateProductPayload rechaza precios no positivos", () => {
  assert.equal(
    validateProductPayload({ ...validProduct, price: 0 }).error,
    "El precio debe ser un número mayor a 0",
  );
});

test("validateProductPayload rechaza stock negativo o decimal", () => {
  for (const stock of [-1, 1.5]) {
    assert.equal(
      validateProductPayload({ ...validProduct, stock }).error,
      "El stock debe ser un número entero mayor o igual a 0",
    );
  }
});

test("validateProductPayload permite actualizaciones parciales", () => {
  assert.deepEqual(
    validateProductPayload({ stock: 9 }, { partial: true }),
    { data: { stock: 9 } },
  );
});
