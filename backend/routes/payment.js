const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { auth } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../services/emailService');
const Booking = require('../models/Booking');

const router = express.Router();

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'inr', bookingId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in paise for INR
      currency: 'inr',
      payment_method_types: ['card'],
      metadata: {
        userId: req.user?.id || 'guest',
        bookingId: bookingId || 'pending'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment and send ticket email
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // Find the booking and populate necessary fields
    const booking = await Booking.findById(bookingId).populate({
      path: 'show',
      populate: [
        { path: 'movie', select: 'title poster' },
        { path: 'theater', select: 'name location' }
      ]
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Update booking payment status
    booking.paymentStatus = 'completed';
    booking.paymentIntentId = paymentIntentId;
    await booking.save();

    // Send confirmation email
    const userEmail = req.user?.email || req.user?.emailAddresses?.[0]?.emailAddress;
    await sendBookingConfirmation({
      _id: booking._id,
      user: { 
        name: userEmail?.split('@')[0] || 'Customer', 
        email: userEmail 
      },
      show: booking.show,
      seats: booking.seats,
      totalAmount: booking.totalAmount,
      ticketId: booking.ticketId
    });

    res.json({ 
      success: true, 
      message: 'Payment confirmed and ticket sent to email',
      booking: booking
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;