const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
  });
};

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Error interno del servidor";

  return res.status(status).json({
    success: false,
    error: message,
  });
};

export { notFoundHandler, errorHandler };
