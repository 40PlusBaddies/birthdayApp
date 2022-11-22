const express = require('express')
const router = express.Router()

const postsController = require("../controllers/posts");
const { ensureAuth } = require('../middleware/auth')

router.get("/", ensureAuth, postsController.getProfile);

//router.get("/logout", postsController.getLogout);