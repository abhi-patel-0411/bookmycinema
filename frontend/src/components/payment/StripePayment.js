import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import { FaCreditCard, FaLock, FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaUniversity, FaWallet } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './StripePayment.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RhYZR4N3NRD17DaFW7M17PFyliGDuPSD2wOxjDLS1NS1jQYk5J0tyELmtu1YawnIMQB1IoEZBS7QQPXh09tsHjv00SfIi8hhu');

const CheckoutForm = ({ amount, onSuccess, onError, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      setError('Payment system not ready. Please try again.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment-success'
        },
        redirect: 'if_required'
      });

      if (result.error) {
        console.error('Stripe payment error:', result.error);
        setError(result.error.message);
        onError(result.error);
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', result.paymentIntent);
        toast.success('Payment successful!');
        onSuccess(result.paymentIntent);
      } else {
        console.log('Payment result:', result);
        setError('Payment status unclear. Please contact support.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || err.message || 'Payment failed');
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-body p-4 p-md-5">
      <form onSubmit={handleSubmit} className="needs-validation" noValidate>
        <div className="row g-4">
          <div className="col-12">
            <div className="payment-section">
              <div className="payment-label-container">
                <FaCreditCard className="payment-icon-accent" />
                <h4 className="payment-section-title">Payment Information</h4>
                <p className="payment-section-subtitle">Enter your card details securely</p>
              </div>
              <div className="payment-element-advanced">
                <PaymentElement
                  options={{
                    layout: 'tabs',
                    paymentMethodOrder: ['card']
                  }}
                />
              </div>
            </div>
          </div>
          
          {error && (
            <div className="col-12">
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <FaExclamationTriangle className="me-2" />
                {error}
              </div>
            </div>
          )}
          
          <div className="col-12">
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="d-flex align-items-center justify-content-center p-3" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <FaLock className="me-2 text-success" />
                  <small className="text-muted">SSL Encrypted</small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="d-flex align-items-center justify-content-center p-3" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <FaShieldAlt className="me-2 text-info" />
                  <small className="text-muted">PCI Compliant</small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="d-flex align-items-center justify-content-center p-3" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <FaCheckCircle className="me-2 text-warning" />
                  <small className="text-muted">Bank Level Security</small>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-12">
            <div className="form-check mb-4">
              <input className="form-check-input" type="checkbox" id="terms" required />
              <label className="form-check-label text-muted" htmlFor="terms">
                I agree to the <a href="#" className="text-decoration-none">Terms of Service</a> and <a href="#" className="text-decoration-none">Privacy Policy</a>
              </label>
              <div className="invalid-feedback">You must agree before proceeding.</div>
            </div>
          </div>
          
          <div className="col-12 text-center">
            <button
              type="submit"
              disabled={!stripe || loading}
              className="btn btn-lg px-5 py-3 shadow-lg"
              style={{
                background: '#e50914',
                border: 'none',
                color: 'white',
                borderRadius: '50px',
                fontSize: '1.1rem',
                fontWeight: '600',
                transition: '0.3s'
              }}
            >
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <FaLock className="me-2" />
                  Pay ₹{amount} Securely
                </>
              )}
            </button>
            <p className="text-muted mt-3 small">Your payment is secured with 256-bit SSL encryption</p>
          </div>
        </div>
      </form>
    </div>
  );
};

const StripePayment = ({ amount, onSuccess, onError, bookingId }) => {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [stripeError, setStripeError] = useState(false);

  React.useEffect(() => {
    const initializePayment = async () => {
      console.log('🔄 Initializing payment with:', { amount, bookingId });
      
      try {
        const response = await api.post('/payment/create-payment-intent', {
          amount: amount,
          currency: 'inr',
          bookingId: bookingId
        });
        
        console.log('✅ Payment intent created:', response.data);
        
        if (bookingId) {
          localStorage.setItem('currentBookingId', bookingId);
        }
        
        if (response.data.clientSecret) {
          setClientSecret(response.data.clientSecret);
          console.log('✅ Client secret set successfully');
        } else {
          throw new Error('No client secret received');
        }
      } catch (error) {
        console.error('❌ Error initializing payment:', error);
        console.error('Error details:', error.response?.data);
        setStripeError(true);
        onError(error);
      } finally {
        setLoading(false);
      }
    };

    if (amount && amount > 0) {
      initializePayment();
    } else {
      console.error('❌ Invalid amount:', amount);
      setStripeError(true);
      setLoading(false);
    }
  }, [amount, bookingId, onError]);

  if (loading) {
    return (
      <div className="card-body p-4 p-md-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-white">Setting up secure payment</h5>
          <p className="text-muted">Please wait while we prepare your payment options...</p>
        </div>
      </div>
    );
  }
  
  if (stripeError || !clientSecret) {
    return (
      <div className="card-body p-4 p-md-5">
        <div className="text-center py-5">
          <div className="mb-4">
            <FaExclamationTriangle size={48} className="text-warning" />
          </div>
          <h5 className="text-white mb-3">Payment Setup Error</h5>
          <p className="text-muted mb-4">Unable to initialize payment. Please try again or contact support.</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary btn-lg px-5 py-3 me-3"
            style={{ borderRadius: '50px', fontWeight: '600' }}
          >
            Retry Payment
          </button>
          <button 
            onClick={() => onSuccess({ id: 'demo_payment_' + Date.now() })}
            className="btn btn-success btn-lg px-5 py-3"
            style={{ borderRadius: '50px', fontWeight: '600' }}
          >
            Demo Booking
          </button>
        </div>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#e50914',
        colorBackground: '#2a2a2a',
        colorText: '#ffffff',
        colorDanger: '#ff4757',
        fontFamily: 'Poppins, sans-serif',
        spacingUnit: '6px',
        borderRadius: '12px',
        focusBoxShadow: '0 0 0 3px rgba(229, 9, 20, 0.25)',
        fontSizeBase: '16px'
      },
      rules: {
        '.Tab': {
          padding: '16px 20px',
          backgroundColor: '#1f1f1f',
          border: '1px solid #444',
          borderRadius: '12px',
          marginBottom: '12px',
          color: '#ffffff',
          transition: 'all 0.3s ease'
        },
        '.Tab--selected': {
          backgroundColor: '#e50914',
          color: '#ffffff',
          border: '1px solid #e50914',
          boxShadow: '0 4px 12px rgba(229, 9, 20, 0.3)'
        },
        '.Input': {
          padding: '16px 20px',
          fontSize: '16px',
          borderRadius: '12px',
          border: '1px solid #444',
          color: '#ffffff',
          backgroundColor: '#2a2a2a'
        },
        '.Input:focus': {
          border: '1px solid #e50914',
          boxShadow: '0 0 0 3px rgba(229, 9, 20, 0.25)'
        },
        '.Label': {
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '600'
        },
        '.Error': {
          color: '#ff4757',
          fontSize: '14px'
        }
      }
    },
    locale: 'en'
  };

  return (
    <div className="stripe-wrapper">
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm 
          amount={amount} 
          onSuccess={onSuccess} 
          onError={onError}
          clientSecret={clientSecret}
        />
      </Elements>
    </div>
  );
};

export default StripePayment;