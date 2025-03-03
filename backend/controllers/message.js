const User = require("../models/User");
const Group = require("../models/Group");
const Message = require("../models/Message");
const RoomMess = require("../models/RoomMess");
exports.sendMessage = async (req, res) => {
  const { reseverId, message, image } = req.body;

  try {
    // Check if a RoomMess already exists between the sender and receiver
    const existingRoomMess = await RoomMess.findOne({
      $or: [
        { members: [req.user.id, reseverId] },
        { members: [reseverId, req.user.id] },
      ],
      roomUser: true,
    });

    // If a RoomMess doesn't exist, create a new one
    if (!existingRoomMess) {
      await new RoomMess({
        room_name: reseverId,
        members: [req.user.id, reseverId],
        roomUser: true,
        media: image ? [image] : [],
        // Add any other fields you need for your RoomMess model
      }).save();
    }

    if (image) {
      // Check if the media array already exists in the RoomMess
      if (existingRoomMess.media) {
        // If it exists, push the new image into the array
        existingRoomMess.media.push(image);
      } else {
        // If it doesn't exist, create a new array with the image
        existingRoomMess.media = [image];
      }
      // Save the changes to the existingRoomMess
      await existingRoomMess.save();
    }

    const newMessage = new Message({
      senderId: req.user.id,
      reseverId: reseverId,
      message: message,
      image: image,
      messageAt: new Date(),
      seen: [],
    });

    const savedMessage = await newMessage.save();

    const newMessages = await Message.find({
      $or: [
        { senderId: req.user.id, reseverId: reseverId },
        { senderId: reseverId, reseverId: req.user.id },
      ],
    }).populate("reseverId", "picture first_name last_name id");

    res.json({ savedMessage: savedMessage, newMessages: newMessages });
  } catch (error) {
    res.status(500).json({
      error: {
        errorMessage: "Internal Sever Error",
      },
    });
  }
};

exports.sendMessageRoom = async (req, res) => {
  const { roommessId, message, image } = req.body;

  try {
    const newMessage = new Message({
      senderId: req.user.id,
      roommessId: roommessId,
      message: message,
      image: image,
      messageAt: new Date(),
    });

    if (image) {
      const roomMess = await RoomMess.findById(roommessId);
      if (roomMess) {
        await roomMess.update({
          $push: { media: image },
        });
      }
    }

    const savedMessage = await newMessage.save();

    const newMessages = await Message.find({
      roommessId: roommessId,
    }).populate("senderId", "picture first_name last_name id");

    res.json({ savedMessage: savedMessage, newMessages: newMessages });
  } catch (error) {
    res.status(500).json({
      error: {
        errorMessage: "Internal Sever Error",
      },
    });
  }
};

exports.getMessagesRoom = async (req, res) => {
  try {
    const roommessId = req.params.roommessId;
    var unseen;
    // Lấy tất cả tin nhắn mà người dùng hiện tại đã gửi hoặc nhận với reseverId
    const messages = await Message.find({
      roommessId: roommessId,
    }).populate("senderId", "picture first_name last_name id");

    messages.sort((a, b) => {
      return b.messageAt - a.messageAt;
    });

    const lmsg = await Message.findOne({
      roommessId: roommessId,
    }).sort({ messageAt: -1 });

    if (
      !lmsg?.seen.includes(req.user.id) &&
      lmsg?.senderId.toString() !== req.user.id &&
      lmsg
    ) {
      unseen = true;
    } else {
      unseen = false;
    }

    res.status(200).json({ mess: messages, unseen });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateSeenMess = async (req, res) => {
  try {
    const { reseverId } = req.body;

    // Cập nhật trạng thái của tin nhắn có reseverId là req.user.id thành "seen"
    await Message.updateMany(
      { senderId: reseverId, reseverId: req.user.id, status: { $ne: "seen" } },
      { $set: { status: "seen" } }
    );

    return res.status(200).json({ message: "ok" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateSeenMessInGroup = async (req, res) => {
  try {
    // Validation
    const { roommessId } = req.body;
    if (!roommessId) {
      return res
        .status(400)
        .json({ error: "Missing roommessId in the request body" });
    }

    // Update messages with the specified roommessId and mark the user as seen
    await Message.updateMany(
      {
        roommessId: roommessId,
      },
      {
        $push: { seen: req.user.id },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Messages updated successfully",
      roommessId: roommessId,
    });
  } catch (error) {
    console.error("Error updating messages:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const senderId = req.user.id;
    const reseverId = req.params.reseverId;
    var unseen;
    // Lấy tất cả tin nhắn mà người dùng hiện tại đã gửi hoặc nhận với reseverId
    const messages = await Message.find({
      $or: [
        { senderId: senderId, reseverId: reseverId },
        { senderId: reseverId, reseverId: senderId },
      ],
    }).populate("reseverId", "picture first_name last_name id");

    messages.sort((a, b) => {
      return b.messageAt - a.messageAt;
    });

    const lmsg = await getLastMess(senderId, reseverId);

    if (lmsg.status === "unseen" && lmsg.reseverId.equals(senderId)) {
      unseen = true;
    } else {
      unseen = false;
    }
    res.status(200).json({ mess: messages, unseen });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getLastMess = async (myId, fdId) => {
  const messages = await Message.findOne({
    $or: [
      { senderId: myId, reseverId: fdId },
      { senderId: fdId, reseverId: myId },
    ],
  }).sort({ messageAt: -1 });

  return messages;
};

exports.getListRoomMess = async (req, res) => {
  try {
    let room_msg = [];
    let numNotifi = 0;
    const currentUserID = req.user.id;
    let otherMember;
    const roomMessList = await RoomMess.find({
      members: { $in: [currentUserID] },
    });

    for (let i = 0; i < roomMessList.length; i++) {
      const groupRef = roomMessList[i].groupRef;
      if (groupRef === undefined) {
        const userRefList = roomMessList[i].members;

        for (let j = 0; j < userRefList.length; j++) {
          if (userRefList[j].toString() !== currentUserID) {
            otherMember = userRefList[j];
          }
        }

        const lmsg = await Message.findOne({
          $or: [
            { senderId: otherMember, reseverId: currentUserID },
            { senderId: currentUserID, reseverId: otherMember },
          ],
        }).sort({ messageAt: -1 });

        if (
          lmsg?.status === "unseen" &&
          lmsg?.reseverId.equals(currentUserID)
        ) {
          numNotifi++;
        }
        const user = await User.findById(otherMember).select(
          "first_name last_name picture id"
        );
        room_msg.push({
          fndInfo: user,
          msgInfo: lmsg,
          group: false,
          messageAt: lmsg?.messageAt,
          userRefList: userRefList,
          roomId: roomMessList[i]._id,
          room_name: `${user.first_name} ${user.last_name}`, // Corrected line
          media: roomMessList[i].media,
          icon: roomMessList[i].icon,
          color: roomMessList[i].color,
        });
      } else {
        const lmsg = await Message.findOne({
          roommessId: roomMessList[i]._id,
        }).sort({ messageAt: -1 });

        if (lmsg) {
          if (
            !lmsg?.seen.includes(currentUserID) &&
            lmsg?.senderId.toString() !== req.user.id
          ) {
            numNotifi++;
          }

          const group = await Group.findById(groupRef).select(
            "group_name  cover id members"
          );
          room_msg.push({
            fndInfo: group,
            msgInfo: lmsg,
            room_name: roomMessList[i].room_name,
            members: group.members,
            group: true,
            roomId: roomMessList[i]._id,
            messageAt: lmsg?.messageAt,
            media: roomMessList[i].media,
            icon: roomMessList[i].icon,
            color: roomMessList[i].color,
          });
        }
      }
    }

    room_msg.sort((a, b) => {
      return b.messageAt - a.messageAt;
    });

    res.status(200).json({
      success: true,
      rooms: room_msg,
      numNotifi: numNotifi,
      roomMessList: roomMessList,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        errorMessage: "Internal Server Error",
      },
    });
  }
};

exports.getInfo = async (req, res) => {
  try {
    const roommessId = req.params.roommessId;
    const roomMess = await RoomMess.findById(roommessId).populate(
      "groupRef",
      "cover group_name  id"
    );
    if (roomMess) {
      res.status(200).json(roomMess);
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}; //xoa

exports.searchListMess = async (req, res) => {
  try {
    const searchTerm = req.params.searchTerm;
    const { dataFriend } = req.body;

    // Tìm kiếm bạn bè của người dùng có tên, họ, hoặc tên người dùng khớp với searchTerm
    const searchResults = await User.find({
      _id: { $in: dataFriend }, // Chỉ tìm trong danh sách bạn bè của người dùng hiện tại
      $or: [
        { first_name: { $regex: searchTerm, $options: "i" } }, // Tìm kiếm theo tên (không phân biệt chữ hoa chữ thường)
        { last_name: { $regex: searchTerm, $options: "i" } }, // Tìm kiếm theo họ (không phân biệt chữ hoa chữ thường)
      ],
    }).select(
      "first_name last_name id picture friends followers requests following"
    );

    res.json(searchResults);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
