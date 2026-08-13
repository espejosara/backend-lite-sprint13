import { loginUser, registerUser } from "../services/auth.service.js";

const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);

    return res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const user = await loginUser(req.body);

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

export { register, login };