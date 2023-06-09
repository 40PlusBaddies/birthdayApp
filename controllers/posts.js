const BirthdayPerson = require("../models/BirthdayPerson");
const User = require("../models/User");
const { ObjectId } = require("mongodb")

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await BirthdayPerson.aggregate([
        { $match: { userId: ObjectId(req.user.id) } },
        {
          $addFields: {
            monthAndDay: {
              $substrBytes: ["$birthday", 5, 5]
            }
          }
        },
        { $sort: { monthAndDay: 1 } }
      ]);
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
  createPost: async (req, res) => {
    try {
      // Upload image to cloudinary
      //const result = await cloudinary.uploader.upload(req.file.path);

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
};
