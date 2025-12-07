// routes/products.js
const express = require("express");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const { scrapeProduct } = require("../agents/puppeteer-agent");

const router = express.Router();

// Helper: safely get userId from token
function getUserIdFromReq(req) {
  return req.user?.id || req.user?.userId || req.user?._id;
}

// GET all products for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ msg: "Invalid token payload: no user id" });
    }

    const products = await Product.find({ userId });
    res.json(products);
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// CREATE a product (and scrape initial price)
router.post("/", authMiddleware, async (req, res) => {
  const { productName, url, size, site = "goat" } = req.body;
  const userId = getUserIdFromReq(req);

  if (!userId) {
    return res.status(401).json({ msg: "Invalid token payload: no user id" });
  }

  if (!productName || !url || size === undefined) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  try {
    // 🔒 LIMIT: max 5 products per user
    const currentCount = await Product.countDocuments({ userId });

    if (currentCount >= 5) {
      return res.status(403).json({
        msg: "You can only track up to 5 products at a time.",
        limit: 5,
        currentCount,
      });
    }

    // 🔥 Use the puppeteer dispatcher
    const result = await scrapeProduct({ url, site, size });

    if (!result.success || result.price === undefined || result.price === null) {
      return res.status(500).json({
        msg: "Failed to retrieve price",
        detail: result.error || "Unknown scrape failure",
      });
    }

    const product = new Product({
      userId,
      productName,
      url,
      size,
      site,
      history: [{ price: result.price, timestamp: new Date() }],
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("❌ Error saving product:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// DELETE product
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ msg: "Invalid token payload: no user id" });
    }

    const deleted = await Product.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!deleted) return res.status(404).json({ msg: "Product not found" });

    res.json({ msg: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting product:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
