const express = require("express");
const router = express.Router();
//const upload = require("../middleware/multer");
const postsController = require("../controllers/posts");
const { ensureAuth } = require("../middleware/auth");

//Post Routes - simplified for now
router.get("/:id", ensureAuth, postsController.getPost);

router.post("/createPost", postsController.createPost);

router.put("/editPost/:id", postsController.editPost);

router.delete("/deletePost/:id", postsController.deletePost);

router.delete("/deleteAcct/:id", postsController.deleteAcct);

module.exports = router;

