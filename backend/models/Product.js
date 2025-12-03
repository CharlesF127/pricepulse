const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    productName: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    // 👟 Size for GOAT sneakers, can be decimal like 6.5
    size: {
      type: Number,
      required: true,
    },

    // 🌐 NEW: which site this product is from
    // For now we only use "goat", but this is ready for "stockx", "nike", etc.
    site: {
      type: String,
      enum: ["goat"],
      default: "goat",
    },

    history: [
      {
        price: {
          type: Number,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // adds createdAt / updatedAt
  }
);

module.exports = mongoose.model("Product", productSchema);
