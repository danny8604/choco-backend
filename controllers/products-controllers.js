const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Product = require("../models/product");

const getAllProducts = async (req, res, next) => {
  let products;
  try {
    products = await Product.find();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, please try again later.",
      500
    );
    return next(error);
  }

  res.json({ products: products });
};

const getProductByPath = async (req, res, next) => {
  const path = req.params.path;
  try {
    const [product] = await Product.find({ path: path });
    res.json({
      product: product,
    });
  } catch (err) {
    res.json({
      message: "error.",
    });
    const error = new HttpError("Could not find this product.🐄", 404);
    return next(error);
  }
};

const getProductByCategory = async (req, res, next) => {
  const category = req.params.categoryId;

  let products;
  try {
    products = await Product.find({ category: category });
  } catch (err) {
    const error = new HttpError("Could not find this product.🐄", 404);
    return next(error);
  }

  res.json({ products: products });
};

const searchProductByName = async (req, res, next) => {
  const { name } = req.body;

  let products;
  try {
    products = await Product.find({ productName: name });
  } catch (err) {
    const error = new HttpError("Could not find this product", 500);
    return next(error);
  }

  if (!products) {
    const error = new HttpError(
      "Could not find products for the provided name. please try another name.",
      401
    );
    return next(error);
  }

  res.json({ product: products });
};

module.exports = {
  getAllProducts,
  getProductByPath,
  getProductByCategory,
  searchProductByName,
};
