const express = require("express");
const router = express.Router();

//establish controller variables
const homeController = require("../controllers/home");
const authController = require("../controllers/auth");
const postsController = require("../controllers/posts");
const { ensureAuth } = require("../middleware/auth");

//main routes
router.get("/", homeController.getIndex);
router.get("/profile", ensureAuth, postsController.getProfile);
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);
router.put("/updateProfile/:id", authController.updateProfile);

router.get("/feed", postsController.getFeed);

module.exports = router;
