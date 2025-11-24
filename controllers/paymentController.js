const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create payment intent
// @route   POST /api/payments/create-payment-intent
// @access  Private
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { items, shipping, coupon } = req.body;

    // Calculate order amount
    let totalAmount = 0;

    // Verify items and calculate total
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      const price = product.salePrice || product.price;
      totalAmount += price * item.quantity;
    }

    // Add shipping cost
    totalAmount += shipping || 0;

    // Apply coupon discount if provided
    if (coupon) {
      // In a real app, you'd validate the coupon here
      // For now, we'll assume a fixed 10% discount for demo
      totalAmount = totalAmount * 0.9;
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: req.user.id.toString(),
        items: JSON.stringify(items)
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      totalAmount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public (Stripe calls this)
exports.handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Helper function to handle successful payment
async function handlePaymentSuccess(paymentIntent) {
  try {
    const { userId, items } = paymentIntent.metadata;
    
    // Create order
    const orderItems = JSON.parse(items);
    
    // Calculate order total and get product details
    let itemsPrice = 0;
    const orderItemsWithDetails = [];
    
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      const price = product.salePrice || product.price;
      
      orderItemsWithDetails.push({
        name: product.name,
        quantity: item.quantity,
        price: price,
        product: item.product,
        image: product.images[0]?.url
      });
      
      itemsPrice += price * item.quantity;
      
      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }
    
    const order = await Order.create({
      user: userId,
      orderItems: orderItemsWithDetails,
      itemsPrice,
      taxPrice: itemsPrice * 0.1, // 10% tax
      shippingPrice: 0, // Free shipping for demo
      totalPrice: itemsPrice + (itemsPrice * 0.1),
      paymentMethod: 'stripe',
      paymentResult: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        update_time: new Date().toISOString(),
        email_address: paymentIntent.receipt_email
      },
      isPaid: true,
      paidAt: new Date(),
      status: 'processing'
    });
    
    console.log(`Order created: ${order._id}`);
    
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}
