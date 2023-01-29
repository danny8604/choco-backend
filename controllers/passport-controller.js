const HttpError = require("../models/http-error");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const googleFailed = (req, res, next) => {
  res.status(401).json({
    success: false,
    message: "Failure.",
  });
};

const googleSuccess = async (req, res, next) => {
  const googleUser = req.user;
  if (!googleUser) return;
  let user;
  let userCart;
  try {
    const existingUser = await User.findOne({ email: googleUser.email });

    if (!existingUser) {
      const error = new HttpError(
        "User not exist, please try signup an account.",
        401
      );
      return next(error);
    }
    const token = jwt.sign(
      {
        userId: existingUser.id,
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
    const getCart = await User.findOne({
      email: googleUser.email,
    }).populate({
      path: "shoppingCart",
      populate: {
        path: "productId",
      },
    });

    console.log(getCart, "🦔🦔🦔🦔🦔🦔🦔🦔");
    userCart = getCart.shoppingCart;
    user = {
      userId: existingUser.id,
      email: existingUser.email,
      token: token,
    };
  } catch (err) {
    const error = new HttpError("Something went wrong. 🦔", 500);
    return next(error);
  }

  res.status(200).json({ user: user, userCart: userCart, success: true });
};

module.exports = {
  googleFailed,
  googleSuccess,
};
