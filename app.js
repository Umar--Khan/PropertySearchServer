const express = require("express"),
  bodyParser = require("body-parser"),
  session = require("express-session"),
  cors = require("cors"),
  errorhandler = require("errorhandler"),
  mongoose = require("mongoose"),
  MongoClient = require("mongodb").MongoClient;

const isProduction = process.env.NODE_ENV === "production";

// Create global app object
const app = express();

app.use(cors());

// Normal express config defaults
app.use(require("morgan")("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(require("method-override")());
app.use(express.static(__dirname + "/public"));

app.use(
  session({
    secret: "conduit",
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
  })
);

if (!isProduction) {
  app.use(errorhandler());
}

// MongoConnection
// const uri =
//   "mongodb+srv://UmarKhan:2bnHHNLDIW37zuf@recipecluster-r6cjr.mongodb.net/test?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true });
// client.connect(err => {
//   const collection = client.db("MoveRight").collection("PropertySearch");
//   // perform actions on the collection object
//   client.close();
// });

mongoose
  .connect(
    "mongodb+srv://UmarKhan:2bnHHNLDIW37zufm@recipecluster-r6cjr.mongodb.net/test?retryWrites=true",
    { useNewUrlParser: true }
  )
  .then(result => {
    console.log("connected");
  })
  .catch(err => {
    console.log(err);
  });

//Add Models here
require("./models/User");

require("./config/passport");

// Routes are required here
app.use(require("./routes"));

/// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (!isProduction) {
  app.use((err, req, res, next) => {
    console.log(err.stack);

    res.status(err.status || 500);
    res.json({
      errors: {
        message: err.message,
        error: err
      }
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    errors: {
      message: err.message,
      error: {}
    }
  });
});

// Server Start
const server = app.listen(process.env.PORT || 3001, () => {
  console.log("Listening on port " + server.address().port);
});
