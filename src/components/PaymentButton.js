import React, { useState } from 'react';
import './PaymentButton.css';

const PaymentButton = ({ amount, eventName, onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Dynamically load Razorpay script
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) throw new Error('Razorpay SDK failed to load');

      // Call your Firebase function to create order
      const response = await fetch(
        'http://localhost:5001/edconnect-9bf3e/us-central1/createRazorpayOrder', 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount }),
        }
      );

      if (!response.ok) throw new Error('Failed to create order');

      const orderData = await response.json();

      // Razorpay checkout options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID, // same as in functions.env
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Your College Name',
        description: `Payment for ${eventName}`,
        order_id: orderData.id,
        handler: function (paymentResponse) {
          if (onSuccess) onSuccess(paymentResponse);
        },
        prefill: {
          name: 'Student Name',
          email: 'student@college.edu',
          contact: '9999999999',
        },
        theme: { color: '#3498db' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      if (onError) onError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button className="payment-button" onClick={handlePayment} disabled={isLoading}>
      {isLoading ? 'Processing...' : 100}
    </button>
  );
};

export default PaymentButton;
