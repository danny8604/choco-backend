const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const HttpError = require("../models/http-error");
const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");

const signup = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      const error = new HttpError(
        "User already exist, please try another user email.",
        401
      );
      return next(error);
    }

    const bcryptPassword = await bcrypt.hash(password, 12);

    const createUser = new User({
      email,
      password: bcryptPassword,
      shoppingCart: [],
      orders: [],
    });

    await createUser.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. create a user failed.",
      500
    );
    return next(error);
  }

  res.status(200).json({ success: true });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let user;
  let userCart;
  try {
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      const error = new HttpError(
        "User not exist, please try signup an account.",
        401
      );
      return next(error);
    }

    // Check Password
    const isValidPassword = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isValidPassword) {
      const error = new HttpError(
        "Your password is not current, please try again later.",
        403
      );
      return next(error);
    }

    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
      },
      "OLAOLAOLAOLAOLAOLAOLAOLAOLAOLA",
      { expiresIn: "1h" }
    );

    if (!token) {
      const error = new HttpError(
        "Something went wrong. please try again later.",
        500
      );
      return next(error);
    }

    const getCart = await User.findById(existingUser._id).populate({
      path: "shoppingCart",
      populate: {
        path: "productId",
      },
    });
    userCart = getCart.shoppingCart;
    console.log(userCart, "CART");

    user = {
      userId: existingUser._id,
      email: existingUser.email,
      token: token,
    };
  } catch (err) {
    const error = new HttpError("Something went wrong.", 500);
    return next(error);
  }

  res.status(200).json({ user: user, userCart: userCart });
};

const addToCart = async (req, res, next) => {
  const { productId } = req.body;

  try {
    const user = await User.findOne({ _id: req.userId });
    console.log(user, "🦔🦔TEST USER");
    const existingItemIndex = user.shoppingCart.findIndex(
      (product) => product.productId.toString() === productId.toString()
    );
    const product = await Product.findOne({ _id: productId });
    const updatedCartItems = [...user.shoppingCart];

    if (existingItemIndex === -1) {
      updatedCartItems.push({
        productId: product._id,
        quantity: 1,
      });
    }
    if (existingItemIndex !== -1) {
      updatedCartItems[existingItemIndex].quantity += 1;
    }

    user.shoppingCart = updatedCartItems;

    await user.save();
  } catch (err) {
    const error = new HttpError("EROROROROROR", 500);
    return next(error);
  }

  let user;
  try {
    user = await User.findById(req.userId).populate({
      path: "shoppingCart",
      populate: {
        path: "productId",
      },
    });
  } catch (err) {
    const error = new HttpError("EROROROROROR", 500);
    return next(error);
  }

  res.json({ cart: user.shoppingCart });
};

const removeFromCart = async (req, res, next) => {
  const { productId } = req.body;

  try {
    const user = await User.findOne({ _id: req.userId });
    const newCartItems = user.shoppingCart.filter(
      (product) => product.productId.toString() !== productId
    );

    user.shoppingCart = newCartItems;
    await user.save();
  } catch (err) {
    const error = new HttpError("EROROROROROR", 500);
    return next(error);
  }

  res.json({ message: "Remove from cart!!" });
};

const editItemQuantity = async (req, res, next) => {
  const { productId, quantity } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid input passed, please check your input data.",
      422
    );
    return next(error);
  }

  try {
    const user = await User.findOne({ _id: req.userId });
    const existingItemIndex = user.shoppingCart.findIndex(
      (product) => product.productId.toString() === productId.toString()
    );
    const updatedCartItems = [...user.shoppingCart];

    if (existingItemIndex === -1) {
      const error = new HttpError(
        "This product does not exist in your shopping cart.",
        500
      );
      return next(error);
    }
    if (existingItemIndex !== -1) {
      updatedCartItems[existingItemIndex].quantity = quantity;
    }

    user.shoppingCart = updatedCartItems;
    await user.save();
  } catch (err) {
    const error = new HttpError("EROROROROROR", 500);
    return next(error);
  }

  res.status(200).json({ message: "Edit successed." });
};

const checkout = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.userId });
    const products = user.shoppingCart.map((item) => {
      return { productId: item.productId, quantity: item.quantity };
    });
    const order = new Order({
      user: {
        email: user.email,
        userId: user._id,
      },
      products: products,
    });
    user.orders.push(order);
    user.shoppingCart = [];

    const sess = await mongoose.startSession();
    sess.startTransaction();
    await order.save({ session: sess });
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "checkout failed, please try again later.",
      403
    );
    return next(error);
  }

  res.status(200).json({ message: "checkout successed." });
};

const orders = async (req, res, next) => {
  let user;
  try {
    user = await User.findOne({ _id: req.userId }).populate("orders");
  } catch (err) {
    const error = new HttpError("you don't have any orders.", 403);
    return next(error);
  }

  res.json({ message: "ORDERS", order: user.orders });
};

module.exports = {
  signup,
  login,
  addToCart,
  removeFromCart,
  editItemQuantity,
  checkout,
  orders,
};
