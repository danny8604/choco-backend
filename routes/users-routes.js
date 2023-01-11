const express = require("express");
const { check } = require("express-validator");
const {
  signup,
  login,
  addToCart,
  removeFromCart,
  editItemQuantity,
  checkout,
  orders,
} = require("../controllers/users-controllers");

const router = express.Router();

router.post(
  "/signup",
  [
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 8 }),
  ],
  signup
);

router.post("/login", login);

router.post("/addToCart", addToCart);

router.post("/removeFromCart", removeFromCart);

router.patch(
  "/editItemQuantity",
  check("quantity").isNumeric().isInt().isLength({ min: 1 }),
  editItemQuantity
);

router.get("/checkout", checkout);

router.get("/orders", orders);

module.exports = router;
