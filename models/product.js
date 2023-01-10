const mongoose = require("mongoose");

const { Schema } = mongoose;

const productSchema = new Schema({
  category: {
    type: String,
    required: true,
  },
  descript: {
    type: String,
    required: true,
  },
  designer: {
    type: String,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  img: {
    imgA: {
      type: String,
      required: true,
    },
    imgB: {
      type: String,
      required: true,
    },
    imgC: {
      type: String,
      required: true,
    },
    imgD: {
      type: String,
      required: true,
    },
    imgE: {
      type: String,
      required: true,
    },
  },
  path: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  series: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Product", productSchema);
