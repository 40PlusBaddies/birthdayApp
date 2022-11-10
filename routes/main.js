const express = require("express");
const router = express.Router();

//establish controller variables
const homeController = require("../controllers/home");
const authController = require("../controllers/auth");

//main routes
router.get("/", homeController.getIndex);
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);

module.exports = router;
