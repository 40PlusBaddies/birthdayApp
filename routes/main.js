const express = require("express");
const router = express.Router();

//establish home controller that leads to login/signup page
const homeController = require("../controllers/home");

router.get("/", homeController.getIndex);

module.exports = router;
