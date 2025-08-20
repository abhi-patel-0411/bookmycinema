const express = require("express");
const { Webhook } = require("svix");
//Simple Webhooks Infrastructure eXtended
const router = express.Router();

// Clerk webhook handler
router.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

      if (!WEBHOOK_SECRET) {
        console.error("CLERK_WEBHOOK_SECRET not configured");
        return res.status(400).json({ error: "Webhook secret not configured" });
      }

      const wh = new Webhook(WEBHOOK_SECRET);
      const evt = wh.verify(req.body, req.headers);

      console.log("Clerk webhook event:", evt.type);

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

module.exports = router;
