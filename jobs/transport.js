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

// try
const path = require("path");
const ejs = require("ejs");

require("dotenv").config({ path: "./config/.env" });
let accessToken = undefined;

//configure emailer 
async function sendNotificationEmail(indAlert) {
    parentPort.postMessage(`sendNotificationEmail function called: ${indAlert.userEmail}`)
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

    // to connect to file
    const requiredPath = path.join(__dirname, "../views/notificationEmail.ejs");
    const data = await ejs.renderFile(requiredPath, {
        indAlert
    });

    //sender metadata (does not need to be valid) and list of recipients - send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Birthday Reminders" <40plusbday@gmail.com>', // sender address
        to: "40plusbday@gmail.com", //indAlert.userEmail, // list of receivers
        subject: "A friend or family member has a birthday coming up!", // Subject line
        //this line below is temporary until we can loop thru all the birthday people for each user somehow
        // text: `hi ${indAlert.userEmail} ${indAlert.individualBirthdayAlert[0].birthdayPerson}'s birthday is coming up!`, // plain text body
        html: data, // html body
        // embed logo
        attachments: [
            {
                filename: 'logo.png',
                path: path.join(__dirname, "../public/images/logo.png"), 
                cid: 'logo'
            }, 
            {
                filename: 'background.jpg', 
                path: path.join(__dirname, '../public/images/background.jpg'),
                cid: 'background'
            }
        ]
    })

    parentPort.postMessage(`Message sent: ${info.messageId}`)
    parentPort.postMessage(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
}

//creates setTimeout wrapper function
function setDelay(ms) { return new Promise(res => setTimeout(res, ms)) }

//creates delay between individual emails in ms
async function recurringTask(indAlert) {
    await setDelay(2500)
    parentPort.postMessage(`recurring task function called: ${indAlert.userEmail}`)
    //pass the individualAlert object to the email function
    await sendNotificationEmail(indAlert)
}

//logic to read db and send email
const BirthdayCountdown = async () => {
    try {
        const posts = await BirthdayPerson.find({}).lean()
        let dailyBirthdayAlerts = []
        
        for (let i = 0; i < posts.length; i++) {
            let birthday = dayjs.utc(posts[i].birthday)
            if (birthday.dayOfYear() === dayjs().dayOfYear()) {
                await createAlerts(posts[i], dailyBirthdayAlerts)
                //await BirthdayPerson.findOneAndUpdate({ _id: posts[i]._id },{ $set: {tomorrowNotificationSent : false} })
            }
            else if (birthday.dayOfYear() - dayjs().dayOfYear() === 1 && 
                     posts[i].tomorrowNotificationSent == false) {
                await createAlerts(posts[i], dailyBirthdayAlerts)
                //await BirthdayPerson.findOneAndUpdate({ _id: posts[i]._id },{ $set: {weekNotificationSent : false} })
                //await BirthdayPerson.findOneAndUpdate({ _id: posts[i]._id },{ $set: {tomorrowNotificationSent : true} })
            }
            else if (birthday.dayOfYear() - dayjs().dayOfYear() <= 7 && 
                     birthday.dayOfYear() - dayjs().dayOfYear() > 1  && 
                     posts[i].weekNotificationSent == false) {
                await createAlerts(posts[i], dailyBirthdayAlerts)
                //await BirthdayPerson.findOneAndUpdate({ _id: posts[i]._id },{ $set: {monthNotificationSent : false} })
                //await BirthdayPerson.findOneAndUpdate({ _id: posts[i]._id },{ $set: {weekNotificationSent : true} })
            }
            else if (birthday.dayOfYear() - dayjs().dayOfYear() <= 31 && 
                     birthday.dayOfYear() - dayjs().dayOfYear() > 7 && 
                     posts[i].monthNotificationSent == false) {
                await createAlerts(posts[i], dailyBirthdayAlerts)
                //await BirthdayPerson.findOneAndUpdate({ _id: posts[i]._id },{ $set: {monthNotificationSent : true} })
            }
        }
        //after all conditionals, Daily Birthday Alerts array is complete for now, time to send emails
        await sendEmails(dailyBirthdayAlerts)

    } catch (err) {
        parentPort.postMessage(err)
        process.exit(1)
    }
}
//run thru the completed array
const sendEmails = async (dailyBirthdayAlerts) => {
    for (let i = 0; i < dailyBirthdayAlerts.length; i++) {
        //pass the individualAlert object to the recurring task function, so we can access the User email and the birthday people and birthdays that need to be emailed today
        await recurringTask(dailyBirthdayAlerts[i]);
    }
}

const createAlerts = async (post, dailyBirthdayAlerts) => {
    //get the birthday people ready to add to the correct object
    let name = post.name;
    let birthday = dayjs.utc(post.birthday).format('MMM D, YYYY');


    //get the Users from the database who have a notification to go out
    let userEmail = await User.findById({ _id: post.userId });

    //if we don't already have the User in the array, we add them here
    if (!dailyBirthdayAlerts.some(e => e.userEmail === userEmail.email)) {
        //make a new object with the User email and their first set of birthday people
        let individualAlerts = {
            userEmail: userEmail.email,
            userName: userEmail.userName,
            individualBirthdayAlert: [{birthdayPerson: name, birthday: birthday}]
        }
        //add the individual alert object to the array 
        await dailyBirthdayAlerts.push(individualAlerts)
    }
    //if the User is already in the array, we add on more birthday people in here
    else {
        //first find the index of the individual alert object that contains the email we already have
        let i = dailyBirthdayAlerts.findIndex(x => x.userEmail === userEmail.email)

        //use the index to add to the birthday people for this user for today's alerts
        await dailyBirthdayAlerts[i].individualBirthdayAlert.push({birthdayPerson: name, birthday: birthday})
    }
   return dailyBirthdayAlerts;
}

//called daily using bree
(async () => {
    dayjs.extend(dayOfYear)
    dayjs.extend(duration)
    dayjs.extend(utc)

    // to test
    // const oauth2Client = new google.auth.OAuth2(
    //     process.env.my_oauth_client_id, // ClientID
    //     process.env.my_oauth_client_secret, // Client Secret
    //     "https://developers.google.com/oauthplayground" // Redirect URL
    // );
    // oauth2Client.setCredentials({ refresh_token: process.env.my_oauth_refresh_token })
    // await oauth2Client.getAccessToken()
    //     .then((token) => accessToken = token)

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
