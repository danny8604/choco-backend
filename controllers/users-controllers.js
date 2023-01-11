const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");

const signup = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    console.log(existingUser, "🐄🐄🐄🐄🐄🐄🐄🐄");
    if (existingUser) {
      const error = new HttpError(
        "User already exist, please try another user email.",
        401
      );
      return next(error);
    }
  } catch (err) {
    const error = new HttpError("Something went wrong.", 500);
    return next(error);
  }

  const createUser = new User({
    email,
    password,
    shoppingCart: [],
    orders: [],
  });

  try {
    await createUser.save();
  } catch (err) {
    const error = new HttpError("Signing Up failed, please try again.", 500);
    return next(error);
  }

  res.status(200).json({ message: "Signup successed!" });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      const error = new HttpError(
        "User not exist, please try signup an account.",
        401
      );
      return next(error);
    }
    if (password !== existingUser.password) {
      const error = new HttpError("Something went wrong. wrong password.", 500);
      return next(error);
    }
  } catch (err) {
    const error = new HttpError("Something went wrong.", 500);
    return next(error);
  }

  res.status(200).json({ message: "logged in successed." });
};

const addToCart = async (req, res, next) => {
  const { productId } = req.body;

  try {
    const user = await User.findOne({ email: "test1@test.com" });
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

  res.json({ message: "Add to cart!!" });
};

const removeFromCart = async (req, res, next) => {
  const { productId } = req.body;

  try {
    const user = await User.findOne({ email: "test1@test.com" });
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
    const user = await User.findOne({ email: "test1@test.com" });
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
    const user = await User.findOne({ email: "test1@test.com" });
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
    console.log(order, "order");

    await order.save();
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "checkout failed, please try again later.",
      403
    );
    return next(error);
  }

  res.status(200).json({ message: "checkout successed." });
};

let user;
const orders = async (req, res, next) => {
  try {
    user = await User.findOne({ email: "test1@test.com" }).populate("orders");
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
