// routes/notifications.js
const express = require("express");
const Notification = require("../models/Notification");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

function getUserIdFromReq(req) {
  return req.user?.id || req.user?.userId || req.user?._id;
}

// GET all notifications for this user
router.get("/", auth, async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ msg: "Invalid token payload: no user id" });
    }

    const notifications = await Notification.find({ userId }).sort({
      timestamp: -1,
    });
    res.json(notifications);
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE a notification
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ msg: "Invalid token payload: no user id" });
    }

    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ msg: "Notification not found or not authorized" });
    }

    res.json({ msg: "Notification deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting notification:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
