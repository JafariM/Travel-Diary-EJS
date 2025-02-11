const express = require("express");
require("express-async-errors");
require("dotenv").config(); // to load the .env file into the process.env object
const auth = require("./middleware/auth");

const session = require("express-session");
const app = express();

const passport = require("passport");
const passportInit = require("./passport/passportInit");

const secretWordRouter = require("./routes/secretWord");


//save secrect word in session obj, in memory of server
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
//   })
// );

const MongoDBStore = require("connect-mongodb-session")(session);
const url = process.env.MONGO_URI;
const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: url,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

//save secret in the session
const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParms));
app.use(require("connect-flash")());

passportInit();
app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));


// secret word handling
app.use("/secretWord", auth,secretWordRouter);


app.use(require("./middleware/storeLocals"));
app.get("/", (req, res) => {
  res.render("index");
});
app.use("/sessions", require("./routes/sessionRoutes"));


app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

const start = async () => {
  
  try {
    await require("./db/connect")(process.env.MONGO_URI);
    app.listen(port, () =>
      
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();