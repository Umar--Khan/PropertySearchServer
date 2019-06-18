const mongoose = require("mongoose");
const router = require("express").Router();
const passport = require("passport");
const User = mongoose.model("User");
const auth = require("../auth");

// Make new user
router.post("/users", function(req, res, next) {
  const user = new User();

  user.email = req.body.user.email;
  user.postcode = req.body.user.postcode;
  user.firstname = req.body.user.firstname;
  user.lastname = req.body.user.lastname;
  user.setPassword(req.body.user.password);

  user
    .save()
    .then(function() {
      return res.json({ user: user.toAuthJSON() });
    })
    .catch(next);
});

// Login
router.post("/users/login", auth.optional, function(req, res, next) {
  if (!req.body.user.email) {
    return res.status(422).json({ errors: { email: "can't be blank" } });
  }

  if (!req.body.user.password) {
    return res.status(422).json({ errors: { password: "can't be blank" } });
  }

  passport.authenticate("local", { session: false }, function(err, user, info) {
    if (err) {
      return next(err);
    }

    if (user) {
      user.token = user.generateJWT();
      return res.json({ user: user.toAuthJSON() });
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

// Get current User
router.get("/user", auth.required, function(req, res, next) {
  User.findById(req.payload.id)
    .then(function(user) {
      if (!user) {
        return res.sendStatus(401);
      }

      return res.json({ user: user.toAuthJSON() });
    })
    .catch(next);
});

// Updating User
router.put("/user", auth.required, function(req, res, next) {
  User.findById(req.payload.id)
    .then(function(user) {
      if (!user) {
        return res.sendStatus(401);
      }

      // only update fields that were actually passed...
      if (typeof req.body.user.email !== "undefined") {
        user.email = req.body.user.email;
      }
      if (typeof req.body.user.password !== "undefined") {
        user.setPassword(req.body.user.password);
      }

      return user.save().then(function() {
        return res.json({ user: user.toAuthJSON() });
      });
    })
    .catch(next);
});

router.param("user", function(req, res, next, id) {
  User.findOne({ _id: id })
    .populate("user")
    .then(function(user) {
      if (!user) {
        return res.sendStatus(404);
      }
      req.user = user;
      return next();
    })
    .catch(next);
});

// Favouriting a Property
router.post("/:user/favorite", auth.required, function(req, res, next) {
  const property = req.body.property;
  const userId = req.payload.id;

  return User.findOne({ _id: userId, "properties.id": property.id }).then(
    resp => {
      if (resp) {
        res.json({ user: resp.toAuthJSON() });
      } else {
        User.findOneAndUpdate(
          { _id: userId },
          {
            $addToSet: {
              properties: property
            }
          },
          { new: true }
        )
          .then(function(resp) {
            res.json({ user: resp.toAuthJSON() });
          })
          .catch(next);
      }
    }
  );
});

// UnFavouriting a Property
router.delete("/:user/favorite", auth.required, function(req, res, next) {
  const property = req.body.property;

  User.findById(req.payload.id).then(function(user) {
    if (!user) {
      return res.sendStatus(401);
    }
    return user
      .unfavoriteProperty(property)
      .then(function() {
        return res.json({ user: user.toAuthJSON() });
      })
      .catch(next);
  });
});

//! Clean DB
// User.collection.drop();

module.exports = router;
