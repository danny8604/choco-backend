const mongoose = require("mongoose");
require("dotenv").config();
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
      favoriteItems: [],
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

  res.json({ success: true });
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
      process.env.JWT_TOKEN,
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
  const { name, address, phone } = req.body;

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
        name: name,
        address: address,
        phone: phone,
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

  res.json({ orderNumber: order._id, orderDate: order.createdAt });
};

////////////////////////////////////////////////////////////////

const stripeCheckout = async (req, res, next) => {
  const { items } = req.body;
  try {
    const user = await User.findById(req.userId).populate({
      path: "shoppingCart",
      populate: {
        path: "productId",
      },
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: user.email,
      mode: "payment",
      line_items: items.map((item) => {
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.productId.productName,
            },
            unit_amount: item.productId.price * 100,
          },
          quantity: item.quantity,
        };
      }),
      success_url: `${process.env.SERVER_URL}/checkout?success=true`,
      cancel_url: `${process.env.SERVER_URL}/checkout?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//////////////////////////////////////////////////

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
    existingUser.password = newHashPassword;
    existingUser.save();
  } catch (err) {
    const error = new HttpError("Something went wrong.");
    return next(error);
  }

  res.json({ message: "Change success." });
};

const favoriteItems = async (req, res, next) => {
  const { productId } = req.body;

  try {
    const user = await User.findById(req.userId).populate({
      path: "favoriteItems",
      populate: "productId",
    });
    const product = await Product.findOne({ _id: productId });
    const existedItem = user.favoriteItems.find(
      (item) => item.productId._id.toString() === productId
    );

    if (existedItem && product) {
      const newFavoriteItems = user.favoriteItems.filter((item) => {
        return item.productId._id.toString() !== productId;
      });
      user.favoriteItems = newFavoriteItems;
      // user.save();
      // return res.json({ favoriteItem: false });
    }
    if (!(existedItem && product)) {
      user.favoriteItems.push({
        productId: product,
      });
      // user.save();
      // return res.json({ favoriteItem: true });
    }
    user.save();
    res.json({ favoriteItems: user.favoriteItems });
  } catch (err) {
    const error = new HttpError("EROROROROROR", 500);
    return next(error);
  }
};

const getFavoriteItems = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: "favoriteItems",
      populate: "productId",
    });

    res.json({ favoriteItems: user.favoriteItems });
  } catch (err) {
    const error = new HttpError("EROROROROROR", 500);
    return next(error);
  }
};

const getFavoriteItemsPage = async (req, res, next) => {
  const perPage = 5;
  const page = req.params.items_page;

  try {
    const user = await User.findById(req.userId).populate({
      path: "favoriteItems",
      populate: "productId",
    });
    const data = user.favoriteItems.slice((page - 1) * perPage, page * perPage);

    res.json({ favoriteItems: data });
  } catch (err) {
    const error = new HttpError("EROROROROROR", 500);
    return next(error);
  }
};

const getUserCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: "shoppingCart",
      populate: {
        path: "productId",
      },
    });

    res.json({ userCart: user.shoppingCart });
  } catch (err) {
    const error = new HttpError("EROROROROROR", 500);
    return next(error);
  }
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
  stripeCheckout,
  favoriteItems,
  getFavoriteItems,
  getUserCart,
  getFavoriteItemsPage,
};
