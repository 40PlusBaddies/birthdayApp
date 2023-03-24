const nodemailer = require('nodemailer');
const BirthdayPerson = require("../models/BirthdayPerson");
const dayjs = require('dayjs');
const dayOfYear = require('dayjs/plugin/dayOfYear');
const duration = require('dayjs/plugin/duration');
const utc = require('dayjs/plugin/utc');
const { google } = require("googleapis");
const { parentPort } = require('worker_threads');
const mongoose = require('mongoose')
const User = require('../models/User');
const { db } = require('../models/User');

require("dotenv").config({ path: "./config/.env" });
let accessToken = undefined;

//configure emailer
async function sendNotificationEmail(email) {
    //source email, requires valid credentials - creates reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            type: 'OAuth2',
            user: process.env.my_gmail_username,
            clientId: process.env.my_oauth_client_id,
            clientSecret: process.env.my_oauth_client_secret,
            refreshToken: process.env.my_oauth_refresh_token,
            accessToken: accessToken
        }, tls: {
            rejectUnauthorized: false
        }
    })
    //sender metadata (does not need to be valid) and list of recipients - send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Birthday Reminders" <birthdayreminderapp@github.com>', // sender address
        to: "40plusbday@gmail.com", // list of receivers
        subject: "A friend or family member has a birthday coming up!", // Subject line
        //text: `${firstName}'s birthday is coming up!`, // plain text body
        html: "<b>html body</b>", // html body
    })

    parentPort.postMessage(`Message sent: ${info.messageId}`)
    parentPort.postMessage(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
}

//creates setTimeout wrapper function
function setDelay(ms) { return new Promise(res => setTimeout(res, ms)) }

//creates delay between individual emails in ms
async function recurringTask(email) {
    await setDelay(1500)
    parentPort.postMessage(`recurring task function called: ${email}`)
    sendNotificationEmail(email)
}

//logic to read db and send email
const BirthdayCountdown = async () => {
    try {
        const posts = await BirthdayPerson.find({}).lean()
        let dailyBirthdayAlerts = []
        
        for (let i = 0; i < posts.length; i++) {
            let birthday = dayjs.utc(posts[i].birthday)
            if (birthday.dayOfYear() === dayjs().dayOfYear()) {
                let userEmail = await User.findById({ _id: posts[i].userId });
                await helperFunction(posts[i], userEmail, dailyBirthdayAlerts)
            }
            else if (birthday.dayOfYear() - dayjs().dayOfYear() === 1 && posts[i].tomorrowNotificationSent == false) {
                let userEmail = await User.findById({ _id: posts[i].userId });
                await helperFunction(posts[i], userEmail, dailyBirthdayAlerts)
            }
            else if (birthday.dayOfYear() - dayjs().dayOfYear() <= 7 && birthday.dayOfYear() - dayjs().dayOfYear() > 1  && posts[i].weekNotificationSent == false) {
                let userEmail = await User.findById({ _id: posts[i].userId });
                await helperFunction(posts[i], userEmail, dailyBirthdayAlerts)
            }
            else if (birthday.dayOfYear() - dayjs().dayOfYear() <= 31 && birthday.dayOfYear() - dayjs().dayOfYear() > 7 && posts[i].monthNotificationSent == false) {
                let userEmail = await User.findById({ _id: posts[i].userId });
                await helperFunction(posts[i], userEmail, dailyBirthdayAlerts)
            }
        }
        //this loop is just for checking out what is happening after the dailyBirthdayAlerts array is created
        //***Maybe we can put the recurringTask() function in here? Not sure */
        for (let i = 0; i < dailyBirthdayAlerts.length; i++) {
            parentPort.postMessage(dailyBirthdayAlerts[i])
            parentPort.postMessage(dailyBirthdayAlerts[i].individualBirthdayAlert)
        }
    } catch (err) {
        parentPort.postMessage(err)
        process.exit(1)
    }
}

const helperFunction = async (post, userEmail, dailyBirthdayAlerts) => {
    let name = post.name;
    let birthday = post.birthday;
    let individualAlerts = {};

    if (!dailyBirthdayAlerts.some(e => e.userEmail === userEmail.email)) {
        parentPort.postMessage("if conditional called")
        individualAlerts = {
            userEmail: userEmail.email,
            individualBirthdayAlert: [{birthdayPerson: name, birthday: birthday}]
        }
        dailyBirthdayAlerts.push(individualAlerts)
    }
    else {
        parentPort.postMessage("else conditional called")
        let i = dailyBirthdayAlerts.findIndex(x => x.userEmail === userEmail.email)
        dailyBirthdayAlerts[i].individualBirthdayAlert.push({birthdayPerson: name, birthday: birthday})
    }
   return dailyBirthdayAlerts;
}

//called daily using bree
(async () => {
    dayjs.extend(dayOfYear)
    dayjs.extend(duration)
    dayjs.extend(utc)

    const oauth2Client = new google.auth.OAuth2(
        process.env.my_oauth_client_id, // ClientID
        process.env.my_oauth_client_secret, // Client Secret
        "https://developers.google.com/oauthplayground" // Redirect URL
    );
    oauth2Client.setCredentials({ refresh_token: process.env.my_oauth_refresh_token })
    await oauth2Client.getAccessToken()
        .then((token) => accessToken = token)

    // stop deprication warning
    mongoose.set('strictQuery', true);
    await mongoose.connect(process.env.DB_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: "birthdayApp",
    }).catch()

    parentPort.postMessage('weeee lets send some emails')
    await BirthdayCountdown();
    

    if (parentPort) parentPort.postMessage('done');
    else process.exit(0);
})();
