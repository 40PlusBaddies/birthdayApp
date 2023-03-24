const nodemailer = require("nodemailer");
const BirthdayPerson = require("../models/BirthdayPerson");
const dayjs = require("dayjs");
const dayOfYear = require("dayjs/plugin/dayOfYear");
const duration = require("dayjs/plugin/duration");
const utc = require("dayjs/plugin/utc");
const { google } = require("googleapis");
const { parentPort } = require("worker_threads");
const mongoose = require("mongoose");

require("dotenv").config({ path: "./config/.env" });
let accessToken = undefined;

// is this redundant?
const ejs = require("ejs");
const path = require("path");
const transporter = require("./transporter");

//configure emailer
async function sendNotificationEmail(firstName) {
  //source email, requires valid credentials - creates reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      type: "OAuth2",
      user: process.env.my_gmail_username,
      clientId: process.env.my_oauth_client_id,
      clientSecret: process.env.my_oauth_client_secret,
      refreshToken: process.env.my_oauth_refresh_token,
      accessToken: accessToken,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // creates variable to connect html body to file notificationEmail.ejs
  //does it come here? makes sense?
  const requiredPath = path.join(__dirname, "../views/notificationEmail.ejs");
  const data = await ejs.renderFile(requiredPath, {
    firstName,
  });

  //sender metadata (does not need to be valid) and list of recipients - send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Birthday Reminders" <birthdayreminderapp@github.com>', // sender address
    to: "40plusbday@gmail.com", // list of receivers
    subject: "A friend or family member has a birthday coming up!", // Subject line
    text: `${firstName}'s birthday is coming up!`, // plain text body
    // html: "<b>html body</b>",
    html: data,
  });

  parentPort.postMessage(`Message sent: ${info.messageId}`);
  parentPort.postMessage(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
}

//creates setTimeout wrapper function
function setDelay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

//creates delay between individual emails in ms
async function recurringTask(firstName) {
  await setDelay(1500);
  sendNotificationEmail(firstName);
}

//logic to read db and send email
const BirthdayCountdown = async () => {
  try {
    const posts = await BirthdayPerson.find({}).lean();
    for (let i = 0; i < posts.length; i++) {
      let birthday = dayjs.utc(posts[i].birthday);
      if (birthday.dayOfYear() == dayjs().dayOfYear()) {
        await recurringTask();
        //posts[i].tomorrowNotificationSent = false
      }
      if (
        birthday.dayOfYear() - dayjs().dayOfYear() == 1 &&
        posts[i].tomorrowNotificationSent == false
      ) {
        await recurringTask();
        //posts[i].weekNotificationSent = false
        //posts[i].tomorrowNotificationSent = true
      }
      if (
        birthday.dayOfYear() - dayjs().dayOfYear() <= 7 &&
        posts[i].weekNotificationSent == false
      ) {
        await recurringTask();
        //posts[i].monthNotificationSent = false
        //posts[i].weekNotificationSent = true
      }
      if (
        birthday.dayOfYear() - dayjs().dayOfYear() <= 31 &&
        posts[i].monthNotificationSent == false
      ) {
        await recurringTask(posts[i].name);
        //await BirthdayPerson.findOneAndUpdate({ _id: posts[i]._id },{ $set: {monthNotificationSent : true} })
      }
    }
  } catch (err) {
    parentPort.postMessage(err);
    process.exit(1);
  }
};

//called daily using bree
(async () => {
  dayjs.extend(dayOfYear);
  dayjs.extend(duration);
  dayjs.extend(utc);

  const oauth2Client = new google.auth.OAuth2(
    process.env.my_oauth_client_id, // ClientID
    process.env.my_oauth_client_secret, // Client Secret
    "https://developers.google.com/oauthplayground" // Redirect URL
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.my_oauth_refresh_token,
  });
  await oauth2Client.getAccessToken().then((token) => (accessToken = token));

  // stop deprication warning
  mongoose.set("strictQuery", true);
  await mongoose
    .connect(process.env.DB_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "birthdayApp",
    })
    .catch();

  parentPort.postMessage("weeee lets send some emails");
  await BirthdayCountdown();

  if (parentPort) parentPort.postMessage("done");
  else process.exit(0);
})();
