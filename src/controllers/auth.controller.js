const users = require("../data/users.json");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

const register = (req, res) => {
  const { name, email, password } = req.body;
  const cleanName = normalizeText(name);
  const cleanEmail = normalizeText(email);
  const cleanPassword = typeof password === "string" ? password : "";

  if (!cleanName || !cleanEmail || !cleanPassword) {
    return res.status(400).json({
      success: false,
      error: "Nombre, email y contraseña son obligatorios",
    });
  }

  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({
      success: false,
      error: "Formato de email inválido",
    });
  }

  if (cleanPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: "La contraseña debe tener al menos 6 caracteres",
    });
  }

  const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail.toLowerCase());
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: "El email ya está registrado",
    });
  }

  const newUser = {
    id: users.length ? users[users.length - 1].id + 1 : 1,
    name: cleanName,
    email: cleanEmail,
    password: cleanPassword,
  };

  users.push(newUser);

  return res.status(201).json({
    success: true,
    data: sanitizeUser(newUser),
  });
};

const login = (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = normalizeText(email);
  const cleanPassword = typeof password === "string" ? password : "";

  if (!cleanEmail || !cleanPassword) {
    return res.status(400).json({
      success: false,
      error: "Email y contraseña son obligatorios",
    });
  }

  const user = users.find((u) => u.email.toLowerCase() === cleanEmail.toLowerCase());
  if (!user || user.password !== cleanPassword) {
    return res.status(401).json({
      success: false,
      error: "Credenciales inválidas",
    });
  }

  return res.json({
    success: true,
    data: sanitizeUser(user),
  });
};

module.exports = { register, login };