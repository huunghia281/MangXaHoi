const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;

const postSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "profilePicture",
        "coverPicture",
        "group",
        "coverPictureGroup",
        "share",
        "pending",
        null,
      ],
      default: null,
    },
    text: {
      type: String,
    },
    images: {
      type: Array,
    },
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    background: {
      type: String,
    },
    group: {
      type: ObjectId,
      ref: "Group",
    },
    st: {
      type: String,
      enum: [
        "delete",
        null,
      ],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);
