// controllers/paymentController.js
import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ PayPal environment setup
const environment =
  process.env.PAYPAL_MODE === 'live'
    ? new paypal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      )
    : new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      );

const client = new paypal.core.PayPalHttpClient(environment);

// ✅ GET /api/v1/payment/config
// Returns Stripe and PayPal public keys
export const config = (req, res) => {
  res.json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    paypalClientId: process.env.PAYPAL_CLIENT_ID,
  });
};

// ✅ POST /api/v1/payment/order
// Create payment intent/order for Stripe or PayPal
export const order = async (req, res, next) => {
  try {
    const { amount, currency, provider, orderId } = req.body;

    if (provider === 'stripe') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // must be in cents
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: { orderId },
      });

      return res.status(201).json({
        provider,
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
      });
    }

    if (provider === 'paypal') {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency.toUpperCase(),
              value: (amount / 100).toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/order/success?orderId=${orderId}`,
          cancel_url: `${process.env.FRONTEND_URL}/order/cancel`,
        },
      });

      const order = await client.execute(request);
      const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;

      return res.status(201).json({
        provider,
        id: order.result.id,
        status: order.result.status,
        approvalUrl,
      });
    }

    res.status(400).json({ message: 'Invalid payment provider' });
  } catch (error) {
    console.error('Payment creation error:', error);
    next(error);
  }
};

// ✅ POST /api/v1/payment/validate
// Verify or capture payments
export const validate = async (req, res, next) => {
  try {
    const { provider, paymentId } = req.body;

    if (provider === 'stripe') {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: 'Stripe payment not completed' });
      }
      return res.status(200).json({
        id: paymentIntent.id,
        status: 'success',
        message: 'Stripe payment verified successfully',
      });
    }

    if (provider === 'paypal') {
      const request = new paypal.orders.OrdersCaptureRequest(paymentId);
      request.requestBody({});
      const capture = await client.execute(request);
      return res.status(200).json({
        id: capture.result.id,
        status: 'success',
        message: 'PayPal payment captured successfully',
      });
    }

    res.status(400).json({ message: 'Invalid payment provider' });
  } catch (error) {
    console.error('Payment validation error:', error);
    next(error);
  }
};
