const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;

const roommessSchema = new mongoose.Schema({
  room_name: {
    type: String,
    default: true,
  },
  groupRef: {
    type: ObjectId,
    ref: "Group",
  },
  roomUser: {
    type: Boolean,
    default: false,
  },
  members: [
    {
      type: ObjectId,
      ref: "User",
    },
  ],
  media: [
    {
      type: String,
    },
  ],
  icon: {
    type: String,
    default: "👍🏻",
  },
  color: {
    type: String,
    default: "#0084FF",
  },
});

module.exports = mongoose.model("RoomMess", roommessSchema);
