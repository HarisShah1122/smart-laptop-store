import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { config, order, validate } from '../controllers/paymentController.js';
import validateRequest from '../middleware/validator.js';
import { body } from 'express-validator';

const router = express.Router();

const validator = {
order: [
body('amount').notEmpty().withMessage('Amount is required'),
body('currency').notEmpty().withMessage('Currency is required'),
body('provider')
.isIn(['stripe', 'paypal'])
.withMessage('Payment provider must be either Stripe or PayPal'),
],
validate: [
body('provider')
.isIn(['stripe', 'paypal'])
.withMessage('Payment provider must be either Stripe or PayPal'),
body('paymentId').notEmpty().withMessage('Payment ID is required').trim(),
],
};

// Payment configuration (Stripe & PayPal keys)
router.get('/config', config);

// Create a new payment order or intent
router.post('/order', validator.order, validateRequest, protect, order);

// Validate payment success
router.post('/order/validate', validator.validate, validateRequest, protect, validate);

export default router;
