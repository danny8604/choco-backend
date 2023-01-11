const mongoose = require("mongoose");

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    user: {
      email: {
        type: String,
        required: true,
      },
      userId: {
        type: mongoose.Types.ObjectId,
        required: true,
      },
    },
    products: [
      {
        productId: {
          type: mongoose.Types.ObjectId,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
