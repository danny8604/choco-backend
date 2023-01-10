const express = require("express");
const {
  getAllProducts,
  getProductByPath,
  getProductByCategory,
  searchProductByName,
} = require("../controllers/products-controllers");

const router = express.Router();

router.get("/", getAllProducts);

router.get("/:path", getProductByPath);

router.get("/category/:categoryId", getProductByCategory);

router.post("/search", searchProductByName);

module.exports = router;
