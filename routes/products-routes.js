const express = require("express");
const {
  getAllProducts,
  getProductById,
  getProductByCategory,
} = require("../controllers/products-controllers");

const router = express.Router();

router.get("/", getAllProducts);

router.get("/:productId", getProductById);

router.get("/category/:categoryId", getProductByCategory);

module.exports = router;
