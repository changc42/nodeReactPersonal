const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const CookieSession = require("cookie-session");
const { Schema } = mongoose;
const keys = require("./keys");

mongoose.connect(keys.mongoURI);
const userSchema = new Schema({
  googleId: String
});
mongoose.model("users", userSchema);
var User = mongoose.model("users");

const app = express();

app.use(
  new CookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: [keys.cookieKey]
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then(user => done(null, user));
});

passport.use(
  new GoogleStrategy(
    {
      clientID: keys.googleClientId,
      clientSecret: keys.googleClientSecret,
      callbackURL: "/auth/google/callback"
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne({ googleId: profile.id }).then(existingUser => {
        if (!existingUser) {
          new User({ googleId: profile.id })
            .save()
            .then(newUser => done(null, newUser));
        } else done(null, existingUser);
      });
    }
  )
);

app.get("/", (req, res) => {
  res.send("holu");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback", passport.authenticate("google"));

app.get("/api/user", (req, res) => {
  res.send(req.user);
});

app.get("/api/logout", (req, res) => {
  req.logout();
  res.send("logged out");
});

const PORT = process.env.PORT || 3500;
app.listen(PORT, () => console.log("running on port " + PORT));
