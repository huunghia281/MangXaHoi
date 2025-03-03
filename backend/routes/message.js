const express = require("express");
const {
  sendMessage,
  getMessages,
  getMessagesRoom,
  sendMessageRoom,
  getListRoomMess,
  updateSeenMess,
  updateSeenMessInGroup,
  getInfo,
} = require("../controllers/message");

const { authUser } = require("../middlwares/auth");

const router = express.Router();
router.put("/sendMessage", authUser, sendMessage);
router.get("/getMessages/:reseverId", authUser, getMessages);
router.put("/updateSeenMess", authUser, updateSeenMess);
router.put("/updateSeenMessInGroup", authUser, updateSeenMessInGroup);
router.put("/sendMessageRoom", authUser, sendMessageRoom);
router.get("/getMessagesRoom/:roommessId", authUser, getMessagesRoom);
router.get("/getListRoomMess", authUser, getListRoomMess);
router.get("/getInfo/:roommessId", authUser, getInfo);
module.exports = router;
