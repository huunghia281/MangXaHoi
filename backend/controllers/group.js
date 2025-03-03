const { validateEmail, validateLength } = require("../helpers/validation");
const moment = require("moment");
const RoomMess = require("../models/RoomMess");
const User = require("../models/User");
const Post = require("../models/Post");
const mongoose = require("mongoose");
const Group = require("../models/Group");

exports.creatGroup = async (req, res) => {
  try {
    const { group_name, privacy } = req.body;

    const group = await new Group({
      group_name,
      public: privacy,
      members: [{ user: req.user.id, type: "admin" }],
    }).save();

    await User.findByIdAndUpdate(req.user.id, {
      $push: { groups_joined: group._id, groups_following: group._id },
    });

    res.send({
      group: group,
      message: "Create Group Success !",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendRequest = async (req, res) => {
  try {
    const { groupId, senderId, receiverId } = req.body;

    const receiver = await User.findById(receiverId);
    // Kiểm tra nếu đã tồn tại yêu cầu gửi đến nhóm từ người gửi
    const existingRequest = receiver.requests_group.find(
      (request) =>
        request.sender &&
        request.group &&
        request.sender.equals(senderId) &&
        request.group.equals(groupId)
    );

    if (!existingRequest && !receiver.groups_joined.includes(groupId)) {
      await User.findByIdAndUpdate(receiverId, {
        $push: { requests_group: { senderRef: senderId, groupRef: groupId } },
      });
    } else {
      return res
        .status(400)
        .json({ message: "Already sent or already a member" });
    }

    res.send("Request success !");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPageGroup = async (req, res) => {
  try {
    const idgroup = req.params.idgroup;
    const groupTemp = await User.findById(req.user.id).select(
      "groups_following"
    );
    const groups_following = groupTemp.groups_following;
    const follow = groups_following.includes(idgroup);
    const pageGroup = await Group.findById(idgroup)
      .populate(
        "members.user",
        "first_name last_name picture friends requests id"
      )
      .populate(
        "pendingMembers.user",
        "first_name last_name picture friends requests id"
      );

    const idFriends = await User.findById(req.user.id).select("friends");

    // Tạo danh sách thành viên là bạn của người dùng
    const friendMembers = pageGroup.members.filter((member) =>
      idFriends.friends.includes(member.user.id)
    );

    // Sắp xếp danh sách thành viên theo thời gian tham gia giảm dần (từ mới nhất đến lâu nhất)
    const sortedMembers = pageGroup.members.sort(
      (a, b) => b.joinedAt - a.joinedAt
    );

    // Tạo danh sách thành viên là admin
    const adminMembers = pageGroup.members.filter(
      (member) => member.type === "admin"
    );

    const posts = await Post.find({
      group: idgroup,
      st: null,
      type: { $ne: "pending" },
    })
      .populate("user", "first_name last_name picture id")
      .populate("group", "group_name cover id ")
      .sort({ createdAt: -1 });

    res.status(200).json({
      ...pageGroup.toObject(),
      posts,
      members: sortedMembers,
      adminMembers,
      friendMembers,
      follow,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateGroupCover = async (req, res) => {
  try {
    const idgroup = req.params.idgroup;
    const { url } = req.body;

    await Group.findByIdAndUpdate(idgroup, {
      cover: url,
    });
    res.json(url);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const { requestId } = req.body;
    const receiver = await User.findById(req.user.id);
    const group = await Group.findById(req.params.idgroup);
    if (!group.members.includes(req.user.id)) {
      if (group.pendingMembers.includes(req.user.id)) {
        await group.updateOne({
          $pull: { pendingMembers: { user: req.user.id } },
        });
      }
      await receiver.updateOne({
        $push: { groups_joined: group._id, groups_following: group._id },
      });
      await group.updateOne({
        $push: { members: { user: receiver._id } },
        $inc: { numMembers: 1 },
      });

      await RoomMess.updateMany(
        {
          groupRef: req.params.idgroup,
        },
        {
          $push: { members: req.user.id },
        }
      );
      await receiver.updateOne({
        $pull: { requests_group: { groupRef: group._id } },
      });
      res.json({ message: "joined to group" });
    } else {
      return res.status(400).json({ message: "Already member" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteInvite = async (req, res) => {
  try {
    const { requestId } = req.body;

    const receiver = await User.findById(req.user.id);

    if (
      receiver &&
      receiver.requests_group &&
      Array.isArray(receiver.requests_group)
    ) {
      const requestIndex = receiver.requests_group.findIndex(
        (request) => request._id.toString() === requestId
      );

      if (requestIndex !== -1) {
        await receiver.updateOne({
          $pull: {
            requests_group: { _id: requestId },
          },
        });

        return res.json({ message: "Deleted invite successfully" });
      } else {
        return res
          .status(400)
          .json({ message: "Invite not found or already deleted" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "Invalid user or requests_group array" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.joingroup = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const group = await Group.findById(req.params.idgroup);
    const isUserPending = group.pendingMembers?.some(
      (pendingMember) => pendingMember.user._id === req.user.id
    );
    if (!group.members?.includes(req.user.id)) {
      if (group.approveMembers && !isUserPending) {
        await group.updateOne({
          $push: { pendingMembers: { user: user._id } },
        });
        return res.json({ message: "Wait for review request." });
      } else {
        await user.updateOne({
          $pull: { requests_group: { groupRef: group._id } },
        });
        await user.updateOne({
          $push: { groups_joined: group._id, groups_following: group._id },
        });
        await RoomMess.updateMany(
          {
            groupRef: req.params.idgroup,
          },
          {
            $push: { members: req.user.id },
          }
        );
        await group.updateOne({
          $push: { members: { user: user._id } },
          $inc: { numMembers: 1 },
        });
        return res.json({ message: "joined to group." });
      }
    } else {
      return res.status(400).json({ message: "Already member" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.leavegroup = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const group = await Group.findById(req.params.idgroup);
    const foundUserInGroup = await Group.findOne({
      _id: req.params.idgroup,
      "members.user": req.user.id,
    });
    if (foundUserInGroup) {
      await user.updateOne({
        $pull: { requests_group: { groupRef: group._id } },
      });
      await user.updateOne({
        $pull: { groups_joined: group._id, groups_following: group._id },
      });
      await group.updateOne({
        $pull: { members: { user: user._id } },
        $inc: { numMembers: -1 },
      });
      await RoomMess.updateMany(
        {
          groupRef: req.params.idgroup,
        },
        {
          $pull: { members: req.user.id },
        }
      );

      res.json({ message: "left the group" });
    } else {
      return res.status(400).json({ message: "Not a member of the group" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.followgroup = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const group = await Group.findById(req.params.idgroup);
    if (!group) {
      return res
        .status(400)
        .json({ message: "Not find any group by idgroup " });
    }

    if (!user.groups_following.includes(req.params.idgroup)) {
      await user.updateOne({
        $push: { groups_following: group._id },
      });

      res.json({ message: "followed to group" });
    } else {
      return res.status(400).json({ message: "Already follow" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unfollowgroup = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const group = await Group.findById(req.params.idgroup);
    if (user.groups_following.includes(req.params.idgroup)) {
      await user.updateOne({
        $pull: { groups_following: group._id },
      });

      res.json({ message: "unfollowed to group" });
    } else {
      return res.status(400).json({ message: "Haven't followed yet" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.settingsgroup = async (req, res) => {
  try {
    const {
      description,
      privacy,
      hideGroup,
      approveMembers,
      approvePosts,
      idGroup,
    } = req.body;

    // Validate that idGroup is present
    if (!idGroup) {
      return res.status(400).json({ message: "idGroup is required." });
    }

    // Find the group by id
    const group = await Group.findById(idGroup);

    // Check if the group exists
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Update properties if they are provided and not null
    if (description !== null && description !== undefined) {
      await Group.findByIdAndUpdate(idGroup, {
        description: description,
      });
    }

    if (privacy !== null && privacy !== undefined) {
      await Group.findByIdAndUpdate(idGroup, {
        public: privacy,
      });
    }

    if (hideGroup !== null && hideGroup !== undefined) {
      await Group.findByIdAndUpdate(idGroup, {
        hidden: hideGroup,
      });
    }

    if (approveMembers !== null && approveMembers !== undefined) {
      await Group.findByIdAndUpdate(idGroup, {
        approveMembers: approveMembers,
      });
    }

    if (approvePosts !== null && approvePosts !== undefined) {
      await Group.findByIdAndUpdate(idGroup, {
        approvePosts: approvePosts,
      });
    }

    // Save the updated group
    await group.save();

    res.status(200).json({ message: "Group settings updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

exports.approveMember = async (req, res) => {
  try {
    const { idGroup, idUser } = req.body;
    const user = await User.findById(idUser);
    // Find the group by id
    const group = await Group.findById(idGroup);

    // Check if the group exists
    if (group) {
      await group.updateOne({
        $pull: { pendingMembers: { user: idUser } },
      });
      await user.updateOne({
        $pull: { requests_group: { groupRef: group._id } },
      });
      await user.updateOne({
        $push: { groups_joined: group._id, groups_following: group._id },
      });
      await group.updateOne({
        $push: { members: { user: user._id } },
        $inc: { numMembers: 1 },
      });
      await RoomMess.updateMany(
        {
          groupRef: idGroup,
        },
        {
          $push: { members: idUser },
        }
      );

      return res
        .status(200)
        .json({ message: "Approved for members to join the group." });
    } else {
      return res.status(404).json({ message: "Group not found." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

exports.declineMember = async (req, res) => {
  try {
    const { idGroup, idUser } = req.body;

    // Find the group by id
    const group = await Group.findById(idGroup);

    // Check if the group exists
    if (group) {
      await group.updateOne({
        $pull: { pendingMembers: { user: idUser } },
      });
      return res
        .status(200)
        .json({ message: "Member has been removed from the approval list." });
    } else {
      return res.status(404).json({ message: "Group not found." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

exports.cancelRequestGroup = async (req, res) => {
  try {
    const { idGroup } = req.body;

    // Find the group by id
    const group = await Group.findById(idGroup);

    // Check if the group exists
    if (group) {
      await group.updateOne({
        $pull: { pendingMembers: { user: req.user.id } },
      });
      return res
        .status(200)
        .json({ message: "Removed request to join group." });
    } else {
      return res.status(404).json({ message: "Group not found." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

exports.pendingposts = async (req, res) => {
  try {
    const { idGroup } = req.body;

    // Find the group by id
    const group = await Group.findById(idGroup);

    // Check if the group exists
    if (group) {
      const pendingposts = await Post.find({
        type: "pending",
        group: idGroup,
        st: null,
      }).populate("user", "first_name last_name picture id");
      pendingposts.sort((a, b) => {
        return b.createdAt - a.createdAt;
      });
      return res.status(200).json(pendingposts);
    } else {
      return res.status(404).json({ message: "Group not found." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

exports.approvependingposts = async (req, res) => {
  try {
    const { idPost } = req.body;

    await Post.findByIdAndUpdate(idPost, {
      $set: {
        type: "group",
      },
    });

    res.status(200).json({ message: "Post approved successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

exports.refusependingposts = async (req, res) => {
  try {
    const { idPost } = req.body;

    await Post.findByIdAndUpdate(idPost, {
      $set: {
        st: "delete",
      },
    });

    res.status(200).json({ message: "Post refused successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

exports.removememberingroup = async (req, res) => {
  try {
    const { idMember, idGroup } = req.body;
    const user = await User.findById(idMember);
    const group = await Group.findById(idGroup).populate(
      "members.user",
      "first_name last_name picture friends requests id"
    );
    const foundUserInGroup = group?.members?.some(
      (member) => member.user._id.toString() === idMember
    );

    if (foundUserInGroup) {
      await user.updateOne({
        $pull: { requests_group: { groupRef: group._id } },
      });
      await user.updateOne({
        $pull: { groups_joined: group._id, groups_following: group._id },
      });
      await group.updateOne({
        $pull: { members: { user: user._id } },
        $inc: { numMembers: -1 },
      });
      await RoomMess.updateMany(
        {
          groupRef: idGroup,
        },
        {
          $pull: { members: idMember },
        }
      );

      res.json({ message: "left the group" });
    } else {
      return res.status(400).json({ message: "Not a member of the group" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.inviteasadmin = async (req, res) => {
  try {
    const { idMember, idGroup } = req.body;
    const user = await User.findById(idMember);
    const group = await Group.findById(idGroup).populate(
      "members.user",
      "first_name last_name picture friends requests id"
    );
    const foundUserInGroup = group?.members?.some(
      (member) =>
        member.user._id.toString() === idMember &&
        member.type.toString() === "member"
    );

    if (foundUserInGroup) {
      await user.updateOne({
        $push: {
          requests_admin: { senderRef: req.user.id, groupRef: group._id },
        },
      });

      await group.updateOne({
        $push: { requests_admin: user._id },
      });

      res.json({ message: "Invite as admin sent" });
    } else {
      return res.status(400).json({ message: "Not a member of the group" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeasadmin = async (req, res) => {
  try {
    const { idMember, idGroup } = req.body;
    const user = await User.findById(idMember);
    const group = await Group.findById(idGroup).populate(
      "members.user",
      "first_name last_name picture friends requests id"
    );
    const foundAdminInGroup = group?.members?.some(
      (member) =>
        member.user._id.toString() === idMember &&
        member.type.toString() === "admin"
    );

    if (foundAdminInGroup) {
      // Update the member type to "member" for the specific user in the group
      const updatedMembers = group.members.map((member) => {
        if (member.user._id.toString() === idMember) {
          return { user: user._id, type: "member" };
        }
        return member;
      });

      await group.updateOne({ $set: { members: updatedMembers } });

      res.json({ message: "Remove as admin" });
    } else {
      return res.status(400).json({ message: "Not a member of the group" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelinviteasadmin = async (req, res) => {
  try {
    const { idMember, idGroup } = req.body;
    const user = await User.findById(idMember);
    const group = await Group.findById(idGroup).populate(
      "members.user",
      "first_name last_name picture friends requests id"
    );
    const foundAdminInGroup = group?.members?.some(
      (member) =>
        member.user._id.toString() === idMember &&
        member.type.toString() === "member"
    );

    if (foundAdminInGroup) {
      await user.updateOne({
        $pull: {
          requests_admin: { senderRef: req.user.id, groupRef: group._id },
        },
      });

      await group.updateOne({
        $pull: { requests_admin: user._id },
      });

      res.json({ message: "Cancel invite as admin" });
    } else {
      return res.status(400).json({ message: "Not a member of the group" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptinviteasadmin = async (req, res) => {
  try {
    const { idMember, idGroup } = req.body;
    const user = await User.findById(idMember);
    const group = await Group.findById(idGroup).populate(
      "members.user",
      "first_name last_name picture friends requests id"
    );
    const foundAdminInGroup = group?.members?.some(
      (member) =>
        member.user._id.toString() === idMember &&
        member.type.toString() === "member"
    );

    if (foundAdminInGroup) {
      await user.updateOne({
        $pull: {
          requests_admin: { senderRef: req.user.id, groupRef: group._id },
        },
      });

      await group.updateOne({
        $pull: { requests_admin: user._id },
      });

      const updatedMembers = group.members.map((member) => {
        if (member.user._id.toString() === idMember) {
          return { user: user._id, type: "admin" };
        }
        return member;
      });

      await group.updateOne({ $set: { members: updatedMembers } });

      res.json({ message: "Accept invite as admin" });
    } else {
      return res.status(400).json({ message: "Not a member of the group" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getusersendinviteasadmin = async (req, res) => {
  try {
    const { idMember, idGroup } = req.body;
    const user = await User.findById(idMember).populate(
      "requests_admin.senderRef",
      "first_name last_name picture friends requests id"
    );

    const group = await Group.findById(idGroup);

    const foundMemberInGroup = group?.members?.some(
      (member) =>
        member.user._id.toString() === idMember &&
        member.type.toString() === "member"
    );

    if (foundMemberInGroup) {
      const usersend = user.requests_admin.map((user) => {
        if (user.groupRef.toString() === idGroup) {
          return user.senderRef;
        }
      });

      res.json(usersend);
    } else {
      return res.json({ message: "Not a member of the group" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
