const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;

const notificationSchema = new mongoose.Schema(
  {
    senderRef: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    receiverRef: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
    },
    postRef: {
      type: ObjectId,
      ref: "Post",
    },
    commentRef: {
      type: ObjectId,
      ref: "Comment",
    },
    link: {
      type: String,
    },
    description: {
      type: String,
    },
    read: {
      type: Boolean, // Đặt kiểu dữ liệu là Boolean cho trường "read"
      default: false, // Nếu bạn muốn mặc định giá trị của "read" là false
    },
    groupRef: {
      type: ObjectId,
      ref: "Group",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
