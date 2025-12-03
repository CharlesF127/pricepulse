// routes/alerts.js
const express = require("express");
const Alert = require("../models/Alert");
const Product = require("../models/Product");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Helper to safely get userId from token
function getUserIdFromReq(req) {
  return (
    req.user?.id ||      // { id: ... }
    req.user?.userId ||  // { userId: ... }
    req.user?._id        // { _id: ... }
  );
}

// Create alert
router.post("/", auth, async (req, res) => {
  try {
    const { productId, targetPriceLow, targetPriceHigh } = req.body;
    const userId = getUserIdFromReq(req);

    if (!userId) {
      return res.status(401).json({ msg: "Invalid token payload: no user id" });
    }

    if (!productId || (!targetPriceLow && !targetPriceHigh)) {
      return res.status(400).json({
        msg: "productId and at least one of targetPriceLow/targetPriceHigh are required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    const alert = await Alert.create({
      userId,
      productId,
      targetPriceLow: targetPriceLow ?? null,
      targetPriceHigh: targetPriceHigh ?? null,
    });

    res.status(201).json(alert);
  } catch (err) {
    console.error("Alert create error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get alerts for logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ msg: "Invalid token payload: no user id" });
    }

    const alerts = await Alert.find({ userId }).populate("productId");
    res.json(alerts);
  } catch (err) {
    console.error("Alert fetch error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Update an alert
router.patch("/:id", auth, async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ msg: "Invalid token payload: no user id" });
    }

    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true }
    );

    if (!alert) return res.status(404).json({ msg: "Alert not found" });

    res.json(alert);
  } catch (err) {
    console.error("Alert update error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Delete an alert
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ msg: "Invalid token payload: no user id" });
    }

    const alert = await Alert.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!alert) return res.status(404).json({ msg: "Alert not found" });

    res.json({ msg: "Alert deleted" });
  } catch (err) {
    console.error("Alert delete error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
