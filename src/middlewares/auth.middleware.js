import { verifyToken } from "../lib/jwt.js";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Token no proporcionado",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      error: "Token inválido o expirado",
    });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: "No tienes permisos para acceder a este recurso",
      });
    }

    return next();
  };
};

export { authenticateToken, requireRole };