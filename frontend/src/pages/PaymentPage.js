import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaTicketAlt, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaCouch, FaLock, FaShieldAlt } from 'react-icons/fa';
import StripePayment from '../components/payment/StripePayment';
import api from '../services/api';
import { testStripeConnection } from '../utils/stripeTest';
import './PaymentPage.css';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingData } = location.state || {};

  useEffect(() => {
    if (!bookingData) {
      navigate('/movies');
      return;
    }
    
    // Test Stripe connection on component mount
    testStripeConnection().then(result => {
      if (!result.success) {
        console.warn('Stripe connection test failed:', result.error);
      }
    });
  }, [bookingData, navigate]);

  const handlePaymentSuccess = async (paymentIntent) => {
    console.log('Payment successful:', paymentIntent);
    
    try {
      // First create the booking
      const bookingPayload = {
        showId: bookingData.showId,
        seats: bookingData.seats,
        totalAmount: bookingData.totalAmount,
        seatDetails: bookingData.seatDetails,
        paymentId: paymentIntent.id,
        paymentStatus: 'completed'
      };

      console.log('Creating booking with payload:', bookingPayload);
      const response = await api.post('/bookings', bookingPayload);
      console.log('Booking created:', response.data);
      
      // Then confirm payment and send email
      try {
        await api.post('/payment/confirm-payment', {
          paymentIntentId: paymentIntent.id,
          bookingId: response.data._id
        });
        console.log('Payment confirmed and email sent');
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
      
      // Navigate to confirmation
      navigate(`/booking-confirmation/${response.data._id}`);
    } catch (error) {
      console.error('Booking creation error:', error);
      // Fallback navigation with demo ID
      const fallbackId = bookingData.bookingId || `demo_${Date.now()}`;
      navigate(`/booking-confirmation/${fallbackId}`);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    // You can add user-friendly error handling here
    alert('Payment failed. Please try again.');
  };

  if (!bookingData) return null;

  return (
    <div className="payment-page">
      <Container className="payment-container">
        <button 
          className="back-button mb-4"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft className="me-2" />Back
        </button>
        
        <div className="payment-wrapper">
          <div className="payment-summary">
            <h4 className="text-white mb-4"><FaTicketAlt className="me-2 text-danger" />Order Summary</h4>
            <div className="summary-row">
              <span>Seats:</span>
              <span>{bookingData.seats?.join(', ')}</span>
            </div>
            <div className="summary-row">
              <span>Show:</span>
              <span>Selected Movie</span>
            </div>
            <div className="summary-row">
              <span>Total:</span>
              <span className="text-danger fw-bold">₹{bookingData.totalAmount}</span>
            </div>
          </div>
          
          <div className="payment-form">
            <h4 className="text-white mb-4"><FaLock className="me-2 text-danger" />Secure Payment</h4>
            <StripePayment
              amount={bookingData.totalAmount}
              bookingId={bookingData.bookingId}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default PaymentPage;