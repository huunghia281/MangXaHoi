const express = require("express");
const {
  createPost,
  getAllPosts,
  savePost,
  deletePost,
  getPost,
  getpostgroups,
  getPostByUrl,
} = require("../controllers/post");
const { authUser } = require("../middlwares/auth");

const router = express.Router();

router.post("/createPost", authUser, createPost);
router.get("/getAllPosts", authUser, getAllPosts);
router.put("/savePost/:id", authUser, savePost);
router.delete("/deletePost/:id", authUser, deletePost);
router.get("/getPost/:id", authUser, getPost);
router.get("/getpostgroups", authUser, getpostgroups);
router.post("/getPostByUrl", authUser, getPostByUrl);

module.exports = router;
