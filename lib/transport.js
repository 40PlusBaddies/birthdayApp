const nodemailer = require('nodemailer');
require("dotenv").config({ path: "./config/.env" });

function sendNotificationEmail(){

// create reusable transporter object using the default SMTP transport (recipient info, needs to be valid credentials)
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
        accessToken: process.env.my_oauth_access_token
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
    transporter.close()
});
}

module.exports = sendNotificationEmail;