import { Order } from "../models/orderModel.js";
import { User } from "../models/userModel.js";
import asyncHandler from 'express-async-handler';

// @desc     Get order by ID
// @method   GET
// @endpoint /api/v1/orders/:id
// @access   Private
const getOrderById = asyncHandler(async (req, res, next) => {
  try {
    const { id: orderId } = req.params;
    console.log('Received orderId:', orderId, 'Type:', typeof orderId); // Debug log

    // Validate orderId
    if (!orderId) {
      res.statusCode = 400;
      throw new Error('Order ID is required');
    }

    const parsedOrderId = parseInt(orderId, 10);
    if (isNaN(parsedOrderId)) {
      res.statusCode = 400;
      throw new Error('Invalid order ID: must be a number');
    }

    const order = await Order.findByPk(parsedOrderId, {
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });

    if (!order) {
      res.statusCode = 404;
      throw new Error('Order not found');
    }

    console.log('Fetched Order:', order.dataValues); // Debug log

    res.status(200).json({
      ...order.dataValues,
      _id: order.id
    });
  } catch (error) {
    console.error('Order fetch error:', error.message, 'Stack:', error.stack); // Detailed error log
    next(error);
  }
});

// Other endpoints remain unchanged
const addOrderItems = asyncHandler(async (req, res, next) => {
  try {
    const {
      cartItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    } = req.body;
    console.log(
      'Order Data:',
      cartItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      'User ID:',
      req.user?.id
    );
    if (!cartItems || cartItems.length === 0) {
      res.statusCode = 400;
      throw new Error('No order items.');
    }
    if (!req.user || !req.user.id) {
      res.statusCode = 401;
      throw new Error('User not authenticated');
    }

    const order = await Order.create({
      userId: req.user.id,
      orderItems: cartItems.map(item => ({
        ...item,
        productId: item._id
      })),
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    });

    console.log('Created Order:', order);

    res.status(201).json({
      ...order.dataValues,
      _id: order.id
    });
  } catch (error) {
    console.error('Order creation error:', error);
    next(error);
  }
});

const getMyOrders = asyncHandler(async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      res.statusCode = 401;
      throw new Error('User not authenticated');
    }

    const orders = await Order.findAll({ where: { userId: req.user.id } });

    if (!orders || orders.length === 0) {
      res.statusCode = 404;
      throw new Error('No orders found for the logged-in user.');
    }

    res.status(200).json(
      orders.map(order => ({
        ...order.dataValues,
        _id: order.id
      }))
    );
  } catch (error) {
    next(error);
  }
});

const updateOrderToPaid = asyncHandler(async (req, res, next) => {
  try {
    const { id: orderId } = req.params;
    const order = await Order.findByPk(orderId);

    if (!order) {
      res.statusCode = 404;
      throw new Error('Order not found!');
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.updateTime,
      email_address: req.body.email
    };

    const updatedOrder = await order.save();

    res.status(200).json({
      ...updatedOrder.dataValues,
      _id: updatedOrder.id
    });
  } catch (error) {
    next(error);
  }
});

const updateOrderToDeliver = asyncHandler(async (req, res, next) => {
  try {
    const { id: orderId } = req.params;
    const order = await Order.findByPk(orderId);

    if (!order) {
      res.statusCode = 404;
      throw new Error('Order not found!');
    }

    order.isDelivered = true;
    order.deliveredAt = new Date();

    const updatedDeliver = await order.save();

    res.status(200).json({
      ...updatedDeliver.dataValues,
      _id: updatedDeliver.id
    });
  } catch (error) {
    next(error);
  }
});

const getOrders = asyncHandler(async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      include: [{ model: User, attributes: ['id', 'name'] }]
    });

    if (!orders || orders.length === 0) {
      res.statusCode = 404;
      throw new Error('Orders not found!');
    }

    res.status(200).json(
      orders.map(order => ({
        ...order.dataValues,
        _id: order.id
      }))
    );
  } catch (error) {
    next(error);
  }
});

export {
  addOrderItems,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDeliver,
  getOrders
};