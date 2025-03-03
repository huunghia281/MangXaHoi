const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;

const reactSchema = new mongoose.Schema({
  react: {
    type: String,
    enum: ["Like", "Love", "Haha", "Sad", "Angry", "Wow"],
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
  messRef: {
    type: ObjectId,
    ref: "Message",
  },
  reactBy: {
    type: ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("React", reactSchema);
