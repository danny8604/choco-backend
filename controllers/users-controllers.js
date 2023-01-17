const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

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

const userCheckout = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid input passed, please check your input data.",
      422
    );
    return next(error);
  }

  let order;
  try {
    const user = await User.findOne({ _id: req.userId }).populate({
      path: "shoppingCart",
      populate: {
        path: "productId",
      },
    });
    const products = user.shoppingCart.map((item) => {
      return { productId: item.productId, quantity: item.quantity };
    });
    const totalPrice = user.shoppingCart.reduce((acc, cur) => {
      return (acc += cur.quantity * cur.productId.price);
    }, 0);
    const totalQuantity = user.shoppingCart.reduce((acc, cur) => {
      return (acc += cur.quantity);
    }, 0);

    order = new Order({
      user: {
        email: user.email,
        userId: user._id,
      },
      products: products,
      totalQuantity: totalQuantity,
      totalPrice: totalPrice,
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
      "userCheckout failed, please try again later.",
      403
    );
    return next(error);
  }

  res.json({ order: order._id });
};

////////////////////////////////////////////////////////////////

const storeItems = new Map([
  [1, { price: 10000, name: "SPY" }],
  [2, { price: 20000, name: "Family" }],
]);

const payment = async (req, res, next) => {
  const { items } = req.body;
  console.log(process.env.SERVER_URL, "as");
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((item) => {
        const storeItem = storeItems.get(item.id);
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: storeItem.name,
            },
            unit_amount: storeItem.price,
          },
          quantity: item.quantity,
        };
      }),
      success_url: process.env.SERVER_URL,
      cancel_url: process.env.SERVER_URL,
    });
    console.log(session, "session");
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOrders = async (req, res, next) => {
  const orderId = req.params.orderId;

  let order;
  try {
    order = await Order.findById(orderId).populate({
      path: "products",
      populate: {
        path: "productId",
      },
    });
  } catch (err) {
    const error = new HttpError("you don't have any orders.", 403);
    return next(error);
  }

  res.json({ order: order });
};

const getUserOrders = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userId).populate({
      path: "orders",
      populate: {
        path: "products",
        populate: {
          path: "productId",
        },
      },
    });
  } catch (err) {
    const error = new HttpError("EROROROROROR", 500);
    return next(error);
  }

  res.json({ orders: user.orders });
};

const changePassword = async (req, res, next) => {
  const { originPassword, newPassword, confirmPassword } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid input passed, please check your input data.",
      422
    );
    return next(error);
  }
  console.log(originPassword, newPassword, confirmPassword);

  try {
    const existingUser = await User.findById(req.userId);
    if (!existingUser) {
      const error = new HttpError(
        "User not exist, please try signup an account.",
        401
      );
      return next(error);
    }

    if (newPassword !== confirmPassword) {
      const error = new HttpError(
        "New password not equal confirm password, please try again later.",
        401
      );
      return next(error);
    }

    const isValidPassword = await bcrypt.compare(
      originPassword,
      existingUser.password
    );

    if (!isValidPassword) {
      const error = new HttpError(
        "Your origin password is not correct, please try again later.",
        403
      );
      return next(error);
    }

    const newHashPassword = await bcrypt.hash(newPassword, 12);
    console.log(newHashPassword);
    existingUser.password = newHashPassword;
    existingUser.save();
  } catch (err) {
    const error = new HttpError("Something went wrong.");
    return next(error);
  }

  res.json({ message: "Change success." });
};

module.exports = {
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
};
