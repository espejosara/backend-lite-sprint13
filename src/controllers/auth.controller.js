import {
  getProfileByUserId,
  loginUser,
  registerUser,
} from "../services/auth.service.js";

const register = async (req, res, next) => {
  try {
    const payload = await registerUser(req.body);

    return res.status(201).json({
      success: true,
      data: payload,
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const payload = await loginUser(req.body);

    return res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    return next(error);
  }
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

export { register, login, me };