const express = require("express");
const passport = require("passport");
const {isUserAuthenticated} = require("../middleware/auth");
const router = express.Router();

const successRedirect = "/";

router.get(
  "/login/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureMessage: "Failed to login to Google, please try again later!",
    failureRedirect: "/login",
    successRedirect: "/"
  }),
  (req, res) => {
    console.log("User: ", req.user);
    res.send("Thanks for signing in!");
  }
);


router.get("/top_secret", isUserAuthenticated, (req, res) => {
  console.log("User:",req.user)
  res.send("POGCHAMP: You have access to this secret!");
});

module.exports = router;
