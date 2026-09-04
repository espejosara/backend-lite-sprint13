const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
  });
};

const PRISMA_ERROR_RESPONSES = {
  P2002: {
    status: 409,
    message: "Ya existe un registro con esos datos",
  },
  P2003: {
    status: 409,
    message: "No se puede completar la operación porque el registro está en uso",
  },
  P2025: {
    status: 404,
    message: "El recurso solicitado no existe",
  },
};

function normalizeHttpError(err) {
  if (err?.type === "entity.parse.failed") {
    return { status: 400, message: "El cuerpo JSON no es válido" };
  }

  const prismaResponse = PRISMA_ERROR_RESPONSES[err?.code];

  if (prismaResponse) {
    return prismaResponse;
  }

  const candidateStatus = Number(err?.status || err?.statusCode);
  const status = Number.isInteger(candidateStatus)
    && candidateStatus >= 400
    && candidateStatus <= 599
    ? candidateStatus
    : 500;

  return {
    status,
    message: err?.message || "Error interno del servidor",
  };
}

const errorHandler = (err, req, res, _next) => {
  const normalizedError = normalizeHttpError(err);
  const { status } = normalizedError;
  const exposeMessage = status < 500 || process.env.NODE_ENV !== "production";
  const message = exposeMessage
    ? normalizedError.message
    : "Error interno del servidor";

  if (status >= 500) {
    console.error(err);
  }

  return res.status(status).json({
    success: false,
    error: message,
  });
};

export { errorHandler, normalizeHttpError, notFoundHandler };
