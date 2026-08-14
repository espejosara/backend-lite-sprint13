import prisma from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const createServiceError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const buildAuthResponse = (user) => ({
  user: sanitizeUser(user),
  token: signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  }),
});

const registerUser = async ({ name, email, password }) => {
  const cleanName = normalizeText(name);
  const cleanEmail = normalizeText(email).toLowerCase();
  const cleanPassword = typeof password === "string" ? password : "";

  if (!cleanName || !cleanEmail || !cleanPassword) {
    throw createServiceError(400, "Nombre, email y contraseña son obligatorios");
  }

  if (!isValidEmail(cleanEmail)) {
    throw createServiceError(400, "Formato de email inválido");
  }

  if (cleanPassword.length < 6) {
    throw createServiceError(400, "La contraseña debe tener al menos 6 caracteres");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existingUser) {
    throw createServiceError(409, "El email ya está registrado");
  }

  const newUser = await prisma.user.create({
    data: {
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
    },
  });

  return buildAuthResponse(newUser);
};

const loginUser = async ({ email, password }) => {
  const cleanEmail = normalizeText(email).toLowerCase();
  const cleanPassword = typeof password === "string" ? password : "";

  if (!cleanEmail || !cleanPassword) {
    throw createServiceError(400, "Email y contraseña son obligatorios");
  }

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user || user.password !== cleanPassword) {
    throw createServiceError(401, "Credenciales inválidas");
  }

  return buildAuthResponse(user);
};

export { registerUser, loginUser };
