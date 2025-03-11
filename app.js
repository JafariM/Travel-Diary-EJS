const express = require("express");
require("express-async-errors");
require("dotenv").config(); 
const csrf = require("host-csrf");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const auth = require("./middleware/auth");
const TravelRouter = require('./routes/travels')
const cookieParser = require("cookie-parser");
const session = require("express-session");

const app = express();

const passport = require("passport");
const passportInit = require("./passport/passportInit");

const secretWordRouter = require("./routes/secretWord");
const MongoDBStore = require("connect-mongodb-session")(session);

const url = process.env.MONGO_URI;
const store = new MongoDBStore({
  uri: url,
  collection: "mySessions",
});

store.on("error", function (error) {
  console.log(error);
});
// Security Middleware
app.use(helmet()); 
app.use(xss()); 

// Rate Limiting 
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// Session Configuration
const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  sessionParms.cookie.secure = true;
}

app.use(cookieParser(process.env.SESSION_SECRET));
app.use(session(sessionParms));
app.use(require("connect-flash")());

passportInit();
app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// CSRF Protection Setup
let csrf_development_mode = true;
if (app.get("env") === "production") {
  csrf_development_mode = false;
  app.set("trust proxy", 1);
}

const csrf_options = {
  protected_operations: ["POST", "PATCH", "DELETE"], // Protect more methods
  protected_content_types: ["application/json", "application/x-www-form-urlencoded"],
  development_mode: csrf_development_mode,
};

const csrf_middleware = csrf(csrf_options);
app.use(csrf_middleware);

// Properly Set CSRF Token in Views
app.use((req, res, next) => {
  try {
    res.locals.csrfToken = req.csrfToken();
  } catch (err) {
    res.locals.csrfToken = null; // Handle missing token 
  }
  next();
});

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use((req, res, next) => {
  if (req.path == "/multiply") {
    res.set("Content-Type", "application/json");
  } else {
    res.set("Content-Type", "text/html");
  }
  next();
});

// Routes
//route for testing
app.get("/multiply", (req, res) => {
  const result = req.query.first * req.query.second;
  if (result.isNaN) {
    result = "NaN";
  } else if (result == null) {
    result = "null";
  }
  res.json({ result: result });
});

app.use("/secretWord", auth, secretWordRouter);
app.use(require("./middleware/storeLocals"));

app.get("/", (req, res) => {
  res.render("index");
});

app.use("/sessions", require("./routes/sessionRoutes"));
app.use('/travels',TravelRouter)

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

let mongoURL = process.env.MONGO_URI;
if (process.env.NODE_ENV == "test") {
  mongoURL = process.env.MONGO_URI_TEST;
}

const port = process.env.PORT || 3000;
const start = () => {
  try {
    require("./db/connect")(mongoURL);
    return app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`),
    );
  } catch (error) {
    console.log(error);
  }
};

start();

module.exports = { app };