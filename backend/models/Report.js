const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;

const reportSchema = new mongoose.Schema({
  postRef: {
    type: ObjectId,
    ref: "Post",
  },
  userRef: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  userReportedRef: {
    type: ObjectId,
    ref: "User",
  },
  commentRef: {
    type: ObjectId,
    ref: "Comment",
  },
  groupReportedRef: {
    type: ObjectId,
    ref: "Group",
  },
  groupRef: {
    type: ObjectId,
    ref: "Group",
  },
  to: {
    type: String,
    enum: ["adminFacebook", "adminGroup"],
    default: "adminFacebook",
  },
  type: {
    type: String,
  },
  st: {
    type: String,
    enum: [
      "keep",
      "remove",
      null,
    ],
    default: null,
  },
  createdAt: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Report", reportSchema);
