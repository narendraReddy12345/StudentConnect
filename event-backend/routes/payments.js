const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order endpoint
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;
    
    // Validate input
    if (!amount || !currency) {
      return res.status(400).json({ 
        error: 'Amount and currency are required' 
      });
    }
    
    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture payment
      notes: notes || {}
    };
    
    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      details: error.error ? error.error.description : error.message
    });
  }
});

// Verify payment endpoint
router.post('/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: 'Missing payment verification data' 
      });
    }
    
    // Create expected signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const expectedSignature = hmac.digest('hex');
    
    // Verify signature
    if (expectedSignature === razorpay_signature) {
      res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid payment signature' 
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      details: error.message
    });
  }
});

// Get payment details endpoint
router.get('/payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await razorpay.payments.fetch(paymentId);
    
    res.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount / 100, // Convert back to rupees
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        createdAt: new Date(payment.created_at * 1000)
      }
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment details',
      details: error.error ? error.error.description : error.message
    });
  }
});

// Refund payment endpoint
router.post('/refund', async (req, res) => {
  try {
    const { paymentId, amount, notes } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ 
        error: 'Payment ID is required' 
      });
    }
    
    const refundOptions = {
      payment_id: paymentId,
      amount: amount ? amount * 100 : undefined, // Full refund if amount not specified
      notes: notes || {}
    };
    
    const refund = await razorpay.refunds.create(refundOptions);
    
    res.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        createdAt: new Date(refund.created_at * 1000)
      }
    });
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({ 
      error: 'Failed to process refund',
      details: error.error ? error.error.description : error.message
    });
  }
});

module.exports = router;