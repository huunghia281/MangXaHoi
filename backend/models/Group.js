const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;
const memberSchema = new mongoose.Schema({
  user: {
    type: ObjectId,
    ref: "User",
  },
  type: {
    type: String,
    enum: ["member", "admin"],
    default: "member",
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});
const groupSchema = mongoose.Schema(
  {
    group_name: {
      type: String,
      required: [true, "first name is required"],
      trim: true,
      text: true,
    },
    cover: {
      type: String,
      trim: true,
      default:
        "https://www.facebook.com/images/groups/groups-default-cover-photo-2x.png",
    },
    public: {
      type: Boolean,
      default: true,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: "",
    },
    approvePosts: {
      type: Boolean,
      default: false,
    },
    approveMembers: {
      type: Boolean,
      default: false,
    },
    numMembers: { type: Number, default: "1" },
    members: [memberSchema],
    pendingMembers: [memberSchema],
    requests: [
      {
        type: ObjectId,
        ref: "User",
      },
    ],
    requests_admin: [
      {
        type: ObjectId,
        ref: "User",
      },
    ],
    isBaned: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Group", groupSchema);
