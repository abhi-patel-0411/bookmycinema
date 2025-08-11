const express = require('express');
const { Webhook } = require('svix');
const directHandler = require('../direct-webhook-handler');

const router = express.Router();

// Clerk webhook handler
router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      console.error('CLERK_WEBHOOK_SECRET not configured');
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    const headers = req.headers;
    const payload = req.body;

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    try {
      evt = wh.verify(payload, headers);
    } catch (err) {
      console.error('Webhook verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }

    const { type, data } = evt;
    console.log('Clerk webhook event:', type);

    // Process directly
    switch (type) {
      case 'user.created':
        await directHandler.handleUserCreated(data);
        break;
      case 'user.updated':
        await directHandler.handleUserUpdated(data);
        break;
      case 'user.deleted':
        await directHandler.handleUserDeleted(data);
        break;
      default:
        console.log(`Unhandled webhook event: ${type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;