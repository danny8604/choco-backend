const HttpError = require("./http-error");
const jwt = require("jsonwebtoken");

const checkAuth = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    const error = new HttpError("Authorization error.", 402);
    throw error;
  }
  const decodeToken = jwt.verify(token, "OLAOLAOLAOLAOLAOLAOLAOLAOLAOLA");

  req.userId = decodeToken.userId;
  next();
};

module.exports = checkAuth;
