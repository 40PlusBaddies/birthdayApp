const nodemailer = require('nodemailer');
const BirthdayPerson = require("../models/BirthdayPerson");
const dayjs = require('dayjs');
require("dotenv").config({ path: "./config/.env" });


//configure emailer
function sendNotificationEmail(){

    //source email, requires valid credentials - creates reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: process.env.mailtrapUser,
            pass: process.env.mailtrapPass
        
        // host: 'smtp.gmail.com',
        // port: 465,
        // secure: true,
        // auth: {
        //     type: 'OAuth2',
        //     user: process.env.my_gmail_username,
        //     clientId: process.env.my_oauth_client_id,
        //     clientSecret: process.env.my_oauth_client_secret,
        //     refreshToken: process.env.my_oauth_refresh_token,
        //     accessToken: process.env.my_oauth_access_token

        },
        tls:{
            rejectUnauthorized:false
        }
    });

    //sender metadata (does not need to be valid) and list of recipients - send mail with defined transport object
    let mailOptions = {
        from: '"Birthday Reminders" <birthdayreminderapp@github.com>', // sender address
        to: "40plusbday@gmail.com", // list of receivers
        subject: "A friend or family member has a birthday coming up!", // Subject line
        text: "Open the app to find out who...", // plain text body
        html: "<b>html body</b>", // html body
    };

    //send mail with defined transport object 
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        transporter.close()
    });
}

//creates setTimeout wrapper function
function setDelay(ms) { return new Promise(res => setTimeout(res, ms)) }

//creates delay between individual emails in ms
async function recurringTask(i) {
    await setDelay(1500)
    console.log('send email test') //sendNotificationEmail()
}

//logic to read db and send email
async function BirthdayCountdown() {
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
            await recurringTask()
            //posts[i].findOneAndUpdate({ _id: req.params.id },{"$set":{"monthNotificationSent":true}})
        }
    }
}

//called daily using bree
BirthdayCountdown()

//console.log('test with no delay')
