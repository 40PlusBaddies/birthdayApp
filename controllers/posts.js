//const cloudinary = require("../middleware/cloudinary");
const BirthdayPerson = require("../models/BirthdayPerson");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await BirthdayPerson.find({ user: req.user.id });
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
        //gifts: req.body.gift-ideas,
      });
      console.log(req.body)
      console.log("Your friend or family member has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
  //probably need to comment/delete the below section out
  // likePost: async (req, res) => {
  //   try {
  //     await BirthdayPerson.findOneAndUpdate(
  //       { _id: req.params.id },
  //       {
  //         $inc: { likes: 1 },
  //       }
  //     );
  //     console.log("Likes +1");
  //     res.redirect(`/post/${req.params.id}`);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await BirthdayPerson.findById({ _id: req.params.id });
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db
      await BirthdayPerson.remove({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
};
