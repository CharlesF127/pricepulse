// server.js 
require("dotenv").config(); // ✅ Load env vars FIRST

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");
const nodemailer = require("nodemailer");

const Product = require("./models/Product");
const Alert = require("./models/Alert");
const Notification = require("./models/Notification");
const User = require("./models/User");
const { scrapeProduct } = require("./agents/puppeteer-agent");

const app = express();
const server = http.createServer(app);

// 👇 Centralized allowed frontend origin
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:8080";

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

// ✅ MongoDB connection
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("❌ MONGO_URI is not defined. Check your .env file.");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => res.send("🟢 PricePulse backend is live"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/alerts", require("./routes/alerts")); // 🔔 Alerts CRUD
app.use("/api/notifications", require("./routes/notifications")); // 📨 Notifications CRUD
app.use("/api/settings", require("./routes/settings")); // ⚙️ User prefs (email/SMS)

/// Email Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: `"PricePulse" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
  }
}

// Cron job (1 hour interval)
cron.schedule("0 * * * *", async () => {
  console.log("🔁 Running scheduled price update...");

  try {
    const products = await Product.find();

    for (const product of products) {
      // must have a size to scrape
      if (!product.size) continue;

      const result = await scrapeProduct({
        url: product.url,
        site: product.site || "goat",
        size: product.size,
      });

      if (!result.success || !result.price) {
        console.log(
          `⚠️ Scrape failed for product ${product._id}:`,
          result.error || "No price returned"
        );
        continue;
      }

      const price = parseFloat(result.price);
      product.history.push({ price, timestamp: new Date() });
      await product.save();

      const alerts = await Alert.find({
        productId: product._id,
        triggered: false,
      });

      for (const alert of alerts) {
        const shouldTriggerLow =
          typeof alert.targetPriceLow === "number" &&
          price <= alert.targetPriceLow;
        const shouldTriggerHigh =
          typeof alert.targetPriceHigh === "number" &&
          price >= alert.targetPriceHigh;

        if (shouldTriggerLow || shouldTriggerHigh) {
          alert.triggered = true;
          await alert.save();

          const user = await User.findById(alert.userId);
          await Notification.create({
            userId: alert.userId,
            productName: product.productName,
            triggeredPrice: price,
            timestamp: new Date(),
          });

          // WebSocket Emit
          io.emit("alertTriggered", {
            userId: String(alert.userId),
            productName: product.productName,
            triggeredPrice: price,
          });

          // Email
          if (user?.email) {
            await sendEmail(
              user.email,
              "🔔 Price Alert Triggered",
              `${product.productName} is now $${price}`
            );
          }

          console.log(`🔔 Alert triggered: ${product.productName} -> $${price}`);
        }
      }
    }
  } catch (err) {
    console.error("❌ Cron error:", err);
  }
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("🔌 User connected to socket.io");

  socket.on("disconnect", () => {
    console.log("❌ User disconnected from socket.io");
  });
});

// Manual price check endpoint (for debugging)
const runPriceCheck = async () => {
  console.log("🔁 [manual] Running price update...");

  const products = await Product.find();

  for (const product of products) {
    if (!product.size) continue;

    const result = await scrapeProduct({
      url: product.url,
      site: product.site || "goat",
      size: product.size,
    });

    if (!result.success || !result.price) continue;

    const price = Number(result.price);
    product.history.push({ price, timestamp: new Date() });
    await product.save();

    const alerts = await Alert.find({
      productId: product._id,
      triggered: false,
    });

    for (const alert of alerts) {
      const shouldTriggerLow =
        typeof alert.targetPriceLow === "number" &&
        price <= alert.targetPriceLow;
      const shouldTriggerHigh =
        typeof alert.targetPriceHigh === "number" &&
        price >= alert.targetPriceHigh;

      if (shouldTriggerLow || shouldTriggerHigh) {
        alert.triggered = true;
        await alert.save();

        const user = await User.findById(alert.userId);
        await Notification.create({
          userId: alert.userId,
          productName: product.productName,
          triggeredPrice: price,
          timestamp: new Date(),
        });

        // WebSocket
        io.emit("alertTriggered", {
          userId: String(alert.userId),
          productName: product.productName,
          triggeredPrice: price,
        });

        console.log(
          `🔔 [manual] Alert triggered: ${product.productName} -> $${price}`
        );
      }
    }
  }
};

app.post("/api/debug/run-price-check", async (req, res) => {
  try {
    await runPriceCheck();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
