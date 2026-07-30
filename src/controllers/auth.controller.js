const users = require("../data/users.json");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

const register = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: "Name, email and password are required",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: "Invalid email format",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 6 characters",
    });
  }

  const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: "Email already registered",
    });
  }

  const newUser = {
    id: users.length ? users[users.length - 1].id + 1 : 1,
    name,
    email,
    password,
  };

  users.push(newUser);

  return res.status(201).json({
    success: true,
    data: sanitizeUser(newUser),
  });
};

const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required",
    });
  }

  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials",
    });
  }

  return res.json({
    success: true,
    data: sanitizeUser(user),
  });
};

module.exports = { register, login };