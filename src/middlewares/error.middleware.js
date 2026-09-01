const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
  });
};

const errorHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const exposeMessage = status < 500 || process.env.NODE_ENV !== "production";
  const message = exposeMessage
    ? err.message || "Error interno del servidor"
    : "Error interno del servidor";

  if (status >= 500) {
    console.error(err);
  }

  return res.status(status).json({
    success: false,
    error: message,
  });
};

export { notFoundHandler, errorHandler };
