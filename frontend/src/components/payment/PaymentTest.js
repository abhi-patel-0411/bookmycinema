import React, { useState } from 'react';
import { Button, Alert, Card } from 'react-bootstrap';
import StripePayment from './StripePayment';

const PaymentTest = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [result, setResult] = useState(null);

  const handlePaymentSuccess = (paymentIntent) => {
    console.log('✅ Payment successful:', paymentIntent);
    setResult({ success: true, paymentIntent });
    setShowPayment(false);
  };

  const handlePaymentError = (error) => {
    console.error('❌ Payment failed:', error);
    setResult({ success: false, error });
  };

  return (
    <div className="container mt-5">
      <Card className="mx-auto" style={{ maxWidth: '600px' }}>
        <Card.Header>
          <h4>Stripe Payment Test</h4>
        </Card.Header>
        <Card.Body>
          {!showPayment ? (
            <div className="text-center">
              <p>Test Stripe payment integration with ₹100</p>
              <Button 
                variant="primary" 
                onClick={() => setShowPayment(true)}
                size="lg"
              >
                Start Payment Test
              </Button>
            </div>
          ) : (
            <StripePayment
              amount={100}
              bookingId="test_booking_123"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}

          {result && (
            <Alert variant={result.success ? 'success' : 'danger'} className="mt-3">
              {result.success ? (
                <div>
                  <strong>Payment Successful!</strong>
                  <br />
                  Payment ID: {result.paymentIntent.id}
                </div>
              ) : (
                <div>
                  <strong>Payment Failed!</strong>
                  <br />
                  Error: {result.error.message || 'Unknown error'}
                </div>
              )}
            </Alert>
          )}

          {result && (
            <div className="text-center mt-3">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setResult(null);
                  setShowPayment(false);
                }}
              >
                Reset Test
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default PaymentTest;