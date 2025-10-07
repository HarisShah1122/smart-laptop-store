import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// PayPal environment setup
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

// Stripe and PayPal configuration endpoint
const config = (req, res) => {
res.send({
stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
paypalClientId: process.env.PAYPAL_CLIENT_ID,
});
};

// Create payment intent (Stripe) or order (PayPal)
const createOrder = async (req, res, next) => {
try {
const { amount, currency, provider } = req.body;

```
if (provider === 'stripe') {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    automatic_payment_methods: { enabled: true },
  });

  res.status(201).json({
    provider,
    clientSecret: paymentIntent.client_secret,
    id: paymentIntent.id,
  });
} else if (provider === 'paypal') {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{ amount: { currency_code: currency, value: (amount / 100).toFixed(2) } }],
  });

  const order = await client.execute(request);
  res.status(201).json({
    provider,
    id: order.result.id,
    status: order.result.status,
  });
} else {
  res.status(400);
  throw new Error('Invalid payment provider');
}
```

} catch (error) {
next(error);
}
};

// Validate payment (Stripe webhook or PayPal capture)
const validate = async (req, res, next) => {
try {
const { provider, paymentId } = req.body;

```
if (provider === 'stripe') {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
  if (paymentIntent.status !== 'succeeded') {
    res.status(400);
    throw new Error('Stripe payment not successful');
  }
  res.status(200).json({
    id: paymentIntent.id,
    status: 'success',
    message: 'Stripe payment verified successfully',
  });
} else if (provider === 'paypal') {
  const request = new paypal.orders.OrdersCaptureRequest(paymentId);
  request.requestBody({});
  const capture = await client.execute(request);
  res.status(200).json({
    id: capture.result.id,
    status: 'success',
    message: 'PayPal payment captured successfully',
  });
} else {
  res.status(400);
  throw new Error('Invalid payment provider');
}
```

} catch (error) {
next(error);
}
};

export { config, createOrder as order, validate };
