const express = require("express");
const { addToCart } = require("../controllers/item-controllers");

const router = express.Router();

router.post("/addToCart/:itemId", addToCart);

module.exports = router;
