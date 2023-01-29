const GoogleStrategy = require("passport-google-oauth2");

const passport = require("passport");
const bcrypt = require("bcryptjs");

const User = require("./models/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      const checkUser = async () => {
        try {
          const existingUser = await User.findOne({
            email: profile.email,
          });
          const bcryptPassword = await bcrypt.hash(
            Math.random().toString(36).slice(-8),
            12
          );
          if (!existingUser) {
            const createUser = new User({
              email: profile.email,
              password: bcryptPassword,
              favoriteItems: [],
              shoppingCart: [],
              orders: [],
            });
            await createUser.save();
            return done(null, profile);
          }
          return done(null, profile);
        } catch (err) {
          console.log(err, "🦔🦔🦔");
          return;
        }
      };
      checkUser();
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});
