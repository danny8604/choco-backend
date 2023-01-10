const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Product = require("../models/product");

const getAllProducts = async (req, res, next) => {
  let products;
  try {
    products = await Product.find();
    console.log(products, "getAllProducts");
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
  let product;
  try {
    product = await Product.find({ path: path });
    console.log(product, "getProductByPath");
  } catch (err) {
    const error = new HttpError("Could not find this product.🐄", 404);
    return next(error);
  }

  res.json({
    product: product,
  });
};

const getProductByCategory = async (req, res, next) => {
  const category = req.params.categoryId;

  let products;
  try {
    products = await Product.find({ category: category });
    console.log(products, "getProductByCategory");
  } catch (err) {
    const error = new HttpError("Could not find this product.🐄", 404);
    return next(error);
  }

  res.status(200).json({ products: products });
};

const searchProductByName = async (req, res, next) => {
  const { name } = req.body;

  let products;
  try {
    products = await Product.find({ productName: name });
    console.log(products, "searchProductByName");
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

  res.status(200).json({ product: products });
};

module.exports = {
  getAllProducts,
  getProductByPath,
  getProductByCategory,
  searchProductByName,
};
