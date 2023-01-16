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
const timezone = require('dayjs/plugin/timezone');
const nodemailer = require('nodemailer');

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
app.locals.timezone = require('dayjs/plugin/timezone') 
dayjs.extend(dayOfYear)
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

function sendNotificationEmail(){

    // create reusable transporter object using the default SMTP transport (recipient info, needs to be valid credentials)
    let transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "insert here",
        pass: "insert here"
    },
    tls:{
        rejectUnauthorized:false
    }
    });

    // send mail with defined transport object (sender info, does not need to be valid)
    let mailOptions = {
        from: '"Birthday Reminders" <birthdayreminderapp@github.com>', // sender address
        to: "40plusbday@gmail.com", // list of receivers
        subject: "A friend or family member has a birthday coming up!", // Subject line
        text: "Open the app to find out who...", // plain text body
        html: "<b>html body</b>", // html body
    };

    // send mail with defined transport object 
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });
}

//Setup Routes For Which The Server Is Listening
app.use("/", mainRoutes);
app.use("/post", postRoutes);

//Server Running
app.listen(process.env.PORT, () => {
    console.log("Server is running, you better catch it!");
});

sendNotificationEmail()