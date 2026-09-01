import { getOrdersByUserId } from "../services/orders.service.js";

export async function getOrders(req, res, next) {
  try {
    const userId = req.user.id;
    const orders = await getOrdersByUserId(userId);

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    return next(error);
  }
}
