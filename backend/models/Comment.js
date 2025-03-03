const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;

const commentSchema = new mongoose.Schema({
  comment: {
    type: String,
  },
  image: {
    type: String,
  },
  commentBy: {
    type: ObjectId,
    ref: "User",
  },
  commentAt: {
    type: Date,
    required: true,
  },
  postRef: {
    type: ObjectId,
    ref: "Post",
  },
  commentRef: {
    type: ObjectId,
    ref: "Comment",
  },
  st: {
    type: String,
    enum: ["delete", null],
    default: null,
  },
});

module.exports = mongoose.model("Comment", commentSchema);
