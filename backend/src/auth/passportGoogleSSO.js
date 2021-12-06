const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, doneCallback) => {
      console.log("GoogleStrategy Executed");

      const defaultUser = {
        displayName: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
        avatar: profile.photos[0].value,
      };

      await User.findOrCreate({
          where: { googleId: profile.id }, 
          defaults: defaultUser
      })
        .catch(err => {
          console.error("Error Serializing", err);
          return doneCallback(err);
        })
        .then(([user, created]) => {
          console.group("NEW USER")
          console.log(user);
          console.log(created);
          console.groupEnd("NEW USER")
          return doneCallback(null, user);
        });


    }
  )
);

passport.serializeUser((user, doneCallback) => {
  console.log('Serializing user: ', user);
  doneCallback(null, user.id);
});

passport.deserializeUser((id, doneCallback)=> {
  
  User.findOne({
    where: { id }
  }).catch (err => {
    console.error("Error Deserializing", err);
    return doneCallback(err, null);
  }).then(user => {
    console.log('Deserialized user: ', user);
    return doneCallback(null, user);
  });
})
