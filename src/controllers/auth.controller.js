import {
  getProfileByUserId,
  loginUser,
  registerUser,
} from "../services/auth.service.js";
import {
  createAuthCookieOptions,
  createClearAuthCookieOptions,
  getAuthCookieName,
} from "../config/auth-cookie.js";

const sendAuthenticatedUser = (res, status, payload) => {
  res.cookie(
    getAuthCookieName(),
    payload.token,
    createAuthCookieOptions(),
  );

  return res.status(status).json({
    success: true,
    data: { user: payload.user },
  });
};

const register = async (req, res, next) => {
  try {
    const payload = await registerUser(req.body);

    return sendAuthenticatedUser(res, 201, payload);
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const payload = await loginUser(req.body);

    return sendAuthenticatedUser(res, 200, payload);
  } catch (error) {
    return next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie(
    getAuthCookieName(),
    createClearAuthCookieOptions(),
  );

  return res.json({
    success: true,
    data: { message: "Sesión cerrada correctamente" },
  });
};

const me = async (req, res, next) => {
  try {
    const payload = await getProfileByUserId(req.user.id);

    return res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    return next(error);
  }
};

export { register, login, logout, me };
