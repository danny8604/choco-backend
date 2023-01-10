const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  shoppingCart: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Product",
  },
});

module.exports = mongoose.model("User", userSchema);
