const mongoose = require("mongoose");
const uniqueValidtor = require("mongoose-unique-validator");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const secret = require("../config").secret;

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      match: [/\S+@\S+\.\S+/, "is invalid"],
      index: true
    },
    hash: String,
    salt: String,
    firstname: String,
    lastname: String,
    postcode: String,
    properties: Array,
    searches: Array
  },
  { timestamps: true }
);

UserSchema.plugin(uniqueValidtor, { message: "is already taken." });

// Securing Password
UserSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, "sha512")
    .toString("hex");
};

// Checking password
UserSchema.methods.validPassword = function(password) {
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, "sha512")
    .toString("hex");
  return this.hash === hash;
};

// Genreate a JWT token
UserSchema.methods.generateJWT = function() {
  const today = new Date();
  const exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      exp: parseInt(exp.getTime() / 1000)
    },
    secret
  );
};

// Creates User response
UserSchema.methods.toAuthJSON = function() {
  return {
    _id: this._id,
    email: this.email,
    token: this.generateJWT(),
    firstname: this.firstname,
    lastname: this.lastname,
    postcode: this.postcode,
    properties: this.properties,
    searches: this.searches
  };
};

//Unfavoriting Properties
UserSchema.methods.unfavoriteProperty = function(property) {
  this.properties.remove(property);
  return this.save();
};

//Delete Searches
UserSchema.methods.deleteSearch = function(search) {
  this.searches.remove(search);
  return this.save();
};

mongoose.model("User", UserSchema);
