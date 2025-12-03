// routes/settings.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");

// GET current user's settings
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "email phoneNumber emailAlertsEnabled smsAlertsEnabled"
    );

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      email: user.email,
      phoneNumber: user.phoneNumber || null,
      emailAlertsEnabled: user.emailAlertsEnabled ?? true,
      smsAlertsEnabled: user.smsAlertsEnabled ?? false,
    });
  } catch (err) {
    console.error("❌ Error fetching settings:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// PATCH update settings
router.patch("/", auth, async (req, res) => {
  try {
    const { phoneNumber, emailAlertsEnabled, smsAlertsEnabled } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (phoneNumber !== undefined) {
      user.phoneNumber = phoneNumber; // e.g. "+17578228104"
    }

    if (emailAlertsEnabled !== undefined) {
      user.emailAlertsEnabled = !!emailAlertsEnabled;
    }

    if (smsAlertsEnabled !== undefined) {
      user.smsAlertsEnabled = !!smsAlertsEnabled;
    }

    await user.save();

    res.json({
      email: user.email,
      phoneNumber: user.phoneNumber || null,
      emailAlertsEnabled: user.emailAlertsEnabled,
      smsAlertsEnabled: user.smsAlertsEnabled,
    });
  } catch (err) {
    console.error("❌ Error updating settings:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
