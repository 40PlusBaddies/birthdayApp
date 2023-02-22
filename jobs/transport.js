const nodemailer = require('nodemailer');
const BirthdayPerson = require("../models/BirthdayPerson");
const dayjs = require('dayjs');
const dayOfYear = require('dayjs/plugin/dayOfYear');
const duration = require('dayjs/plugin/duration');
const utc = require('dayjs/plugin/utc');
dayjs.extend(dayOfYear)
dayjs.extend(duration)
dayjs.extend(utc)
require("dotenv").config({ path: "./config/.env" });
const { google } = require("googleapis");
const { default: mongoose } = require('mongoose');
const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
    process.env.my_oauth_client_id, // ClientID
    process.env.my_oauth_client_secret, // Client Secret
    "https://developers.google.com/oauthplayground" // Redirect URL
);
oauth2Client.setCredentials({ refresh_token: process.env.my_oauth_refresh_token })
const accessToken = oauth2Client.getAccessToken()

//configure emailer
async function sendNotificationEmail(firstName) {
    //source email, requires valid credentials - creates reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        // host: "sandbox.smtp.mailtrap.io",
        // port: 2525,
        // auth: {
        //     user: process.env.mailtrapUser,
        //     pass: process.env.mailtrapPass

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
      },tls: {
        rejectUnauthorized: false
      }
    })
    //sender metadata (does not need to be valid) and list of recipients - send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Birthday Reminders" <birthdayreminderapp@github.com>', // sender address
        to: "40plusbday@gmail.com", // list of receivers
        subject: "A friend or family member has a birthday coming up!", // Subject line
        text: `${firstName}'s birthday is coming up!`, // plain text body
        html: "<b>html body</b>", // html body
    })
  
    console.log("Message sent: %s", info.messageId)
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
}

//creates setTimeout wrapper function
function setDelay(ms) { return new Promise(res => setTimeout(res, ms)) }

//creates delay between individual emails in ms
async function recurringTask(firstName) {
    await setDelay(2000)
    sendNotificationEmail(firstName).catch(console.error)
}

//logic to read db and send email
const BirthdayCountdown = async () => {
    try {
        await mongoose.connect(process.env.DB_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: "birthdayApp",
        })
        const posts = await BirthdayPerson.find({ }).lean()
        for(let i = 0; i < posts.length; i++){
            let birthday = dayjs.utc(posts[i].birthday)
            if(birthday.dayOfYear() == dayjs().dayOfYear()){
                await recurringTask()
                //posts[i].tomorrowNotificationSent = false
            }if(birthday.dayOfYear() - dayjs().dayOfYear() == 1 && posts[i].tomorrowNotificationSent == false){
                await recurringTask()
                //posts[i].weekNotificationSent = false
                //posts[i].tomorrowNotificationSent = true
            }if(birthday.dayOfYear() - dayjs().dayOfYear() <= 7 && posts[i].weekNotificationSent == false){
                await recurringTask()
                //posts[i].monthNotificationSent = false
                //posts[i].weekNotificationSent = true
            }if(birthday.dayOfYear() - dayjs().dayOfYear() <= 31 && posts[i].monthNotificationSent == false){
                await recurringTask(posts[i].name)
                //posts[i].findOneAndUpdate({ _id: req.params.id },{"$set":{"monthNotificationSent":true}})
            }
        }
    }catch (err) {
        console.error(err)
        process.exit(1)
    }
}

//called daily using bree
BirthdayCountdown()