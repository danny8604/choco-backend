const HttpError = require("../models/http-error");
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
  const itemId = req.params.itemId;
  console.log(itemId);

  try {
    const user = await User.findOne({ email: "test@test.com" });
    const test = user.shoppingCart.find(
      (product) => product.productId.toString() === itemId
    );
    console.log(test, "RERWERWERWER");
    if (!test) {
      const item = new Item({
        productId: itemId,
        quantity: 1,
      });
      user.shoppingCart.push(item);
    }
    if (test) {
      user.shoppingCart;
      console.log(test, "🐧FIND");
    }

    await user.save();
  } catch (err) {
    const error = new HttpError("EROROROROROR", 500);
    return next(error);
  }

  res.json({ message: "Add to cart !!" });
};

module.exports = {
  signup,
  login,
  addToCart,
};
