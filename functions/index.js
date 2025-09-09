require('dotenv').config();

const functions = require("firebase-functions");
const Razorpay = require("razorpay");

// Cloud Function to create Razorpay order
exports.createRazorpayOrder = functions
  .https.onRequest(async (req, res) => {
    try {
      // Initialize Razorpay
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,     // use env variables instead of deprecated functions.config()
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);

      res.status(200).json(order);
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ error: "Server error creating order" });
    }
  });
