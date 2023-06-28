const BirthdayPerson = require("../models/BirthdayPerson");
const User = require("../models/User");
const fs = require('fs');
const dayjs = require('dayjs');

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await BirthdayPerson.find({ userId: req.user.id }).sort({ name: 1 }).lean();
      console.log("get profile called");
      res.render("profile.ejs", { posts: posts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  // probably need to comment/delete the below section out
  getFeed: async (req, res) => {
    try {
      const posts = await BirthdayPerson.find({ userId: req.user.id }).sort({ createdAt: "desc" }).lean();
      res.render("feed.ejs", { posts: posts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await BirthdayPerson.findById(req.params.id);
      res.render("post.ejs", { post: post, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getCsv: async (req, res) => {
    try {
      const people = await BirthdayPerson.find({ userId: req.params.id });
      
      // csvData will be an array of strings representing the User object and the people objects; each CSV string in the array represents one row in the final file
      const fields = ['name', 'birthday', 'relation', 'gifts'];
      const csvData = [];

      // add header row to the csvData array
      csvData.push(fields.join(','));

      // add each person's data as a new row in the csvData array
      people.forEach((item) => {
        const rowData = fields.map((field) => {
          if (field === 'birthday') {
            return dayjs(item[field]).format('YYYY-MM-DD');
          }
          return item[field];
        });
    
        csvData.push(rowData.join(','));
      });

      // download file name
      const fileName = "friend-list-db.csv";

      // fs method that writes data to file
      fs.writeFileSync(fileName, csvData.join('\n'));

      // sets the response headers for the download
      res.setHeader('Content-Type', 'text/csv'); // informs browser of file type
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`); // informs browser to treat file as attachment rather than displaying it in browser

      // stream file contents to browser as the data is being read from the file
      const fileStream = fs.createReadStream(fileName); // creates a stream to read data from a file
      fileStream.pipe(res); // connects a readable stream to a writable stream

      // deletes temporary file used for streaming the CSV data after the data has been successfully sent as a response; the clean up step
      fileStream.on('end', () => { //event listener emitted when the entire file has been read and streamed
        fs.unlinkSync(fileName); //deletes the temporary file that was created earlier to store the CSV data
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  },
  createPost: async (req, res) => {
    try {
      await BirthdayPerson.create({
        name: req.body.name,
        relation: req.body.relation,
        birthday: req.body.birthday,
        userId: req.user.id,
        gifts: req.body.gift,
      });
      console.log(req.body)
      console.log("Your friend or family member has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
  editPost: async (req, res) => {
    try {
      await BirthdayPerson.findOneAndUpdate(
        { _id: req.params.id },
        {
          $set: {name : req.body.name, birthday : req.body.birthday, gifts : req.body.gifts},
        }
      );
      console.log("Post Updated");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await BirthdayPerson.findById({ _id: req.params.id });
      
      // Delete post from db
      await BirthdayPerson.deleteOne({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
  deleteAcct: async (req, res) => {
    try {
      // Delete posts from db
      await BirthdayPerson.deleteMany({ userId: req.params.id });
      console.log("Deleted All User Posts");
      // Delete user from db
      await User.deleteOne({ _id: req.params.id });
      console.log("Deleted User Acct");
      res.redirect("/");
    } catch (err) {
      res.redirect("/profile");
    }
  },
};
