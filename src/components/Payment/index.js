import React, { useEffect } from 'react';
import { FiLoader, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const Payment = ({ amount, event, user, onSuccess, onFailure }) => {
  const [loading, setLoading] = React.useState(false);
  const [paymentStatus, setPaymentStatus] = React.useState(null);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          resolve(true);
        };
        script.onerror = () => {
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

  // Create order via backend API
  const createOrder = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'INR',
          receipt: `event_${event.id}_${Date.now()}`,
          notes: {
            eventId: event.id,
            eventName: event.title,
            userId: user.id || 'guest'
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      return data.order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  // Verify payment via backend API
  const verifyPayment = async (paymentData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Payment verification failed');
      }

      return data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  };

  const initiatePayment = async () => {
    setLoading(true);
    setPaymentStatus(null);

    try {
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        throw new Error('Payment system is not ready. Please try again.');
      }

      // Create order via backend
      const order = await createOrder();

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Event Registration System',
        description: `Registration for ${event.title}`,
        image: 'https://your-logo-url.com/logo.png',
        order_id: order.id,
        handler: async function(response) {
          try {
            // Verify payment with backend
            const verification = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            // Payment successful and verified
            setPaymentStatus('success');
            setLoading(false);
            onSuccess({
              ...response,
              verified: true,
              verification
            });
          } catch (error) {
            // Payment verification failed
            setPaymentStatus('failed');
            setLoading(false);
            onFailure({
              error: 'Payment verification failed',
              details: error.message
            });
          }
        },
        prefill: {
          name: user.name || 'Guest User',
          email: user.email || 'guest@example.com',
          contact: user.phone || '9999999999'
        },
        notes: {
          eventId: event.id,
          eventName: event.title
        },
        theme: {
          color: '#3399cc'
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function(response) {
        setPaymentStatus('failed');
        setLoading(false);
        onFailure({
          error: 'Payment failed',
          details: response.error,
          code: response.error.code
        });
      });
      
      rzp.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      setPaymentStatus('failed');
      setLoading(false);
      onFailure({
        error: 'Payment initialization failed',
        details: error.message
      });
    }
  };

  return (
    <div className="payment-container">
      <h3>Payment Details</h3>
      <div className="payment-summary">
        <p>Event: {event.title}</p>
        <p>Amount: ₹{amount}</p>
      </div>
      
      {paymentStatus === 'success' ? (
        <div className="payment-success">
          <FiCheckCircle size={24} />
          <p>Payment Successful!</p>
          <p>Your registration is complete.</p>
        </div>
      ) : paymentStatus === 'failed' ? (
        <div className="payment-failed">
          <FiXCircle size={24} />
          <p>Payment Failed. Please try again.</p>
        </div>
      ) : (
        <button 
          className="pay-button"
          onClick={initiatePayment}
          disabled={loading}
        >
          {loading ? (
            <>
              <FiLoader className="spinner" />
              Processing...
            </>
          ) : (
            `Pay ₹${amount}`
          )}
        </button>
      )}
    </div>
  );
};

export default Payment;