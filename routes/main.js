const express = require("express");
const router = express.Router();

//establish home controller that leads to login/signup page
const homeController = require("../controllers/home");

router.get("/", homeController.getIndex);
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);

module.exports = router;
