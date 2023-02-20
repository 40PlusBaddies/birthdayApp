//declare the initial variables to associate their respective component
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const methodOverride = require("method-override");
const flash = require("express-flash");
const logger = require("morgan");
const Bree = require('bree')
const connectDB = require("./config/database");
//declare root route, start here
const mainRoutes = require("./routes/main");
const { use } = require("passport");
//declare post (add member) route - (uninitialized)
const postRoutes = require("./routes/posts");
const dayjs = require('dayjs');
const dayOfYear = require('dayjs/plugin/dayOfYear');
const duration = require('dayjs/plugin/duration');
const utc = require('dayjs/plugin/utc');
const nodemailer = require('nodemailer');
const sendNotificationEmail = require('./jobs/transport');

//Use .env file in config folder
require("dotenv").config({ path: "./config/.env" });

// Passport config
require("./config/passport")(passport);

//Connect To Database
connectDB();

//Using EJS for views
app.set("view engine", "ejs");

//Static Folder
app.use(express.static("public"));

//Body Parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Logging
app.use(logger("dev"));

//Use forms for put / delete
app.use(methodOverride("_method"));

// Setup Sessions - stored in MongoDB
app.use(
    session({
        secret: "keyboard cat",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            client: mongoose.connection.getClient(),
        }),
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Use flash messages for errors, info, ect...
app.use(flash());

app.locals.dayjs = require('dayjs');
app.locals.dayOfYear = require('dayjs/plugin/dayOfYear');
app.locals.duration = require('dayjs/plugin/duration');
app.locals.utc = require('dayjs/plugin/utc')
dayjs.extend(dayOfYear)
dayjs.extend(duration)
dayjs.extend(utc)

//tells bree which file to schedule and sets time
const bree = new Bree({
    jobs: [{
        name: 'transport',
        cron: ' 40 14 * * * ',
    }]
});

(async () => {
    await bree.start();
})();


//Setup Routes For Which The Server Is Listening
app.use("/", mainRoutes);
app.use("/post", postRoutes);

//Server Running
app.listen(process.env.PORT, () => {
    console.log("Server is running, you better catch it!");
});
