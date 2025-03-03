const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const messageSchema = new mongoose.Schema({
  senderId: {
    type: ObjectId,
    ref: "User",
  },
  reseverId: {
    type: ObjectId,
    ref: "User",
  },
  roommessId: {
    type: ObjectId,
    ref: "RoomMess",
  },
  message: {
    type: String,
  },
  image: {
    type: String,
  },
  status: {
    type: String,
    default: "unseen",
  },
  seen: [
    {
      type: ObjectId,
      ref: "User",
    },
  ],
  messageAt: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Message", messageSchema);
