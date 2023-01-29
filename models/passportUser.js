const mongoose = require("mongoose");

const { Schema } = mongoose;

const passportUserSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    required: true,
  },
  shoppingCart: [
    {
      productId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Product",
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  favoriteItems: [
    {
      productId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Product",
      },
    },
  ],
  orders: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Order",
    },
  ],
});

module.exports = mongoose.model("PassportUser", passportUserSchema);
