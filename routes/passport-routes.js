const express = require("express");
const passport = require("passport");
const {
  googleFailed,
  googleSuccess,
} = require("../controllers/passport-controller");
require("dotenv").config();

const router = express.Router();

router.get("/login/success", googleSuccess);
router.get("/login/failed", googleFailed);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get("/logout", (req, res) => {
  console.log("🦔🦔🦔🦔🦔🦔🦔🦔🦔");
  req.logout();
  res.redirect(process.env.SERVER_URL);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: process.env.SERVER_URL,
    failureRedirect: `/login/failed`,
  })
);

module.exports = router;
