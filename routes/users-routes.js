const express = require("express");
const { check } = require("express-validator");
const {
  signup,
  login,
  addToCart,
  removeFromCart,
  editItemQuantity,
  userCheckout,
  getOrders,
  getUserOrders,
  changePassword,
  payment,
} = require("../controllers/users-controllers");
const checkAuth = require("../models/check-auth");

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

router.post("/stripe", payment);

router.get("/getOrders/:orderId", getOrders);

router.use(checkAuth);

router.get("/getUserOrders", getUserOrders);

router.post("/addToCart", addToCart);

router.post("/removeFromCart", removeFromCart);

router.patch(
  "/editItemQuantity",
  check("quantity").isNumeric().isInt().isLength({ min: 1 }),
  editItemQuantity
);

router.post(
  "/userCheckout",
  [
    check("name").notEmpty(),
    check("address").notEmpty(),
    check("phone").isNumeric().isInt().isLength({ min: 10 }),
  ],
  userCheckout
);

router.post(
  "/changePassword",
  [
    check("originPassword").notEmpty().isLength({ min: 8 }),
    check("newPassword").notEmpty().isLength({ min: 8 }),
    check("confirmPassword").notEmpty().isLength({ min: 8 }),
  ],
  changePassword
);

module.exports = router;
