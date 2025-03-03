const { validateEmail, validateLength } = require("../helpers/validation");
const moment = require("moment");
const User = require("../models/User");
const Post = require("../models/Post");
const Code = require("../models/Code");
const Group = require("../models/Group");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary");
const { generateToken } = require("../helpers/tokens");
const {
  sendVerificationEmail,
  sendResetCode,
  sendVerifiCode,
} = require("../helpers/mailer");
const generateCode = require("../helpers/generateCode");
const mongoose = require("mongoose");

exports.register = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      bYear,
      bMonth,
      bDay,
      gender,
    } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({
        message: "invalid email address",
      });
    }
    const check = await User.findOne({ email });
    if (check) {
      return res.status(400).json({
        message:
          "This email address already exists,try with a different email address",
      });
    }

    if (!validateLength(first_name, 3, 30)) {
      return res.status(400).json({
        message: "first name must between 3 and 30 characters.",
      });
    }
    if (!validateLength(last_name, 3, 30)) {
      return res.status(400).json({
        message: "last name must between 3 and 30 characters.",
      });
    }
    if (!validateLength(password, 6, 40)) {
      return res.status(400).json({
        message: "password must be atleast 6 characters.",
      });
    }

    const cryptedPassword = await bcrypt.hash(password, 12);

    const user = await new User({
      first_name,
      last_name,
      email,
      password: cryptedPassword,
      bYear,
      bMonth,
      bDay,
      gender,
    }).save();
    const emailVerificationToken = generateToken(
      { id: user._id.toString() },
      "30m"
    );
    const code = generateCode(5);
    const savedCode = await new Code({
      code,
      user: user._id,
      type: "verifi",
    }).save();
    sendVerifiCode(user.email, user.first_name, code);
    const token = generateToken({ id: user._id.toString() }, "7d");
    res.send({
      id: user._id,
      picture: user.picture,
      first_name: user.first_name,
      last_name: user.last_name,
      token: token,
      verified: user.verified,
      message: "Register Success ! please activate your email to start",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.activateAccount = async (req, res) => {
  try {
    const validUser = req.user.id;
    const { token } = req.body;
    const user =  jwt.verify(token, process.env.TOKEN_SECRET);
    const check = await User.findById(user.id);

    if (validUser !== user.id) {
      return res.status(400).json({
        message: "You don't have the authorization to complete this operation.",
      });
    }
    if (check.verified == true) {
      return res
        .status(400)
        .json({ message: "This email is already activated." });
    } else {
      await User.findByIdAndUpdate(user.id, { verified: true });
      return res
        .status(200)
        .json({ message: "Account has beeen activated successfully." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message:
          "the email address you entered is not connected to an account.",
      });
    }
    const check = await bcrypt.compare(password, user.password);
    if (!check) {
      return res.status(400).json({
        message: "Invalid credentials.Please try again.",
      });
    }
    if (!user.verified) {
      return res.status(400).json({
        message: "Unverified account.",
      });
    }
    const token = generateToken({ id: user._id.toString() }, "7d");

    res.send({
      id: user._id,
      picture: user.picture,
      first_name: user.first_name,
      last_name: user.last_name,
      token: token,
      verified: user.verified,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.sendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select("-password");
    await Code.findOneAndRemove({ user: user._id, type: "verifi" });
    if (user.verified === true) {
      return res.status(400).json({
        message: "This account is already activated.",
      });
    }
    // const emailVerificationToken = generateToken(
    //   { id: user._id.toString() },
    //   "30m"
    // );
    const code = generateCode(5);
    const savedCode = await new Code({
      code,
      user: user._id,
      type: "verifi",
    }).save();
    sendVerifiCode(user.email, user.first_name, code);
    return res.status(200).json({
      message: "Email verification link has been sent to your email.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.findUser = async (req, res) => {
  try {
    const { email, verified } = req.body;
    const user = await User.findOne({
      email: email,
      verified: verified,
    }).select("-password");
    if (!user) {
      return res.status(400).json({
        message: "Account does not exists.",
      });
    }
    return res.status(200).json({
      email: user.email,
      picture: user.picture,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendResetPasswordCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select("-password");
    await Code.findOneAndRemove({ user: user._id });
    const code = generateCode(5);
    const savedCode = await new Code({
      code,
      user: user._id,
      type: "reset",
    }).save();
    sendResetCode(user.email, user.first_name, code);
    return res.status(200).json({
      message: "Email reset code has been sent to your email",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.validateResetCode = async (req, res) => {
  try {
    const { email, code, type } = req.body;
    const user = await User.findOne({ email: email });
    const Dbcode = await Code.findOne({ user: user._id, type: type });
    if (Dbcode.code !== code) {
      return res.status(400).json({
        message: "Verification code is wrong..",
      });
    }
    return res.status(200).json({ message: "ok" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.validateVerifiCode = async (req, res) => {
  try {
    const { email, code, type } = req.body;
    
    // Check if the user exists
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the verification code exists
    const verificationCodes = await Code.find({ user: user._id, type: type });
    if (!verificationCodes || verificationCodes.length === 0) {
      return res.status(404).json({ message: "Verification code not found." });
    }

    // Check if the entered code matches any of the codes in the database
    const correctCode = verificationCodes.find((dbCode) => dbCode.code === code);
    if (!correctCode) {
      return res.status(400).json({
        message: "Verification code is wrong.",
        verificationCodes: verificationCodes,
      });
    }

    // Update the user's verified status
    await User.findOneAndUpdate({ email: email }, { $set: { verified: true } });

    // Generate and send a new token
    const token = generateToken({ id: user._id.toString() }, "7d");
    return res.status(200).send({
      id: user._id,
      picture: user.picture,
      first_name: user.first_name,
      last_name: user.last_name,
      token: token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.changePassword = async (req, res) => {
  const { email, password } = req.body;

  const cryptedPassword = await bcrypt.hash(password, 12);
  await User.findOneAndUpdate(
    { email },
    {
      password: cryptedPassword,
    }
  );
  return res.status(200).json({ message: "ok" });
};

exports.getProfile = async (req, res) => {
  try {
    const { idUser } = req.params;
    const user = await User.findById(req.user.id);
    const isValidObjectId = mongoose.Types.ObjectId.isValid(idUser);
    if (!isValidObjectId) {
      return res.json({ ok: false });
    }
    const profile = await User.findById(idUser).select("-password");
    const friendship = {
      friends: false,
      following: false,
      requestSent: false,
      requestReceived: false,
    };

    if (
      user.friends.includes(profile._id) &&
      profile.friends.includes(user._id)
    ) {
      friendship.friends = true;
    }
    if (user.following.includes(profile._id)) {
      friendship.following = true;
    }
    if (user.requests.includes(profile._id)) {
      friendship.requestReceived = true;
    }
    if (profile.requests.includes(user._id)) {
      friendship.requestSent = true;
    }

    // Tìm ra danh sách bạn chung
    const mutualFriendIds = user.friends.filter((friendId) =>
      profile.friends.includes(friendId)
    );

    // Lấy thông tin về bạn chung
    const mutualFriends = await User.find({
      _id: { $in: mutualFriendIds },
    }).select(
      "first_name last_name id picture friends followers requests following"
    );

    const posts = await Post.find({ user: idUser, group: null })
      .populate("user")
      .sort({ createdAt: -1 });
    await profile.populate(
      "friends",
      "first_name last_name id picture friends followers requests following"
    );
    res.json({ ...profile.toObject(), posts, friendship, mutualFriends });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    const { url } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      picture: url,
    });
    res.json(url);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCover = async (req, res) => {
  try {
    const { url } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      cover: url,
    });
    res.json(url);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateDetails = async (req, res) => {
  try {
    const { infos } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      {
        details: infos,
      },
      {
        new: true,
      }
    );
    res.json(updated.details);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.addFriend = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        !receiver.requests.includes(sender._id) &&
        !receiver.friends.includes(sender._id)
      ) {
        await receiver.updateOne({
          $push: { requests: sender._id },
        });
        await receiver.updateOne({
          $push: { followers: sender._id },
        });
        await sender.updateOne({
          $push: { following: receiver._id },
        });
        res.json({ message: "friend request has been sent" });
      } else {
        return res.status(400).json({ message: "Already sent" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't send a request to yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.cancelRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        receiver.requests.includes(sender._id) &&
        !receiver.friends.includes(sender._id)
      ) {
        await receiver.updateOne({
          $pull: { requests: sender._id },
        });
        await receiver.updateOne({
          $pull: { followers: sender._id },
        });
        await sender.updateOne({
          $pull: { following: receiver._id },
        });
        res.json({ message: "you successfully canceled request" });
      } else {
        return res.status(400).json({ message: "Already Canceled" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't cancel a request to yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.follow = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        !receiver.followers.includes(sender._id) &&
        !sender.following.includes(receiver._id)
      ) {
        await receiver.updateOne({
          $push: { followers: sender._id },
        });

        await sender.updateOne({
          $push: { following: receiver._id },
        });
        res.json({ message: "follow success" });
      } else {
        return res.status(400).json({ message: "Already following" });
      }
    } else {
      return res.status(400).json({ message: "You can't follow yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.unfollow = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        receiver.followers.includes(sender._id) &&
        sender.following.includes(receiver._id)
      ) {
        await receiver.updateOne({
          $pull: { followers: sender._id },
        });

        await sender.updateOne({
          $pull: { following: receiver._id },
        });
        res.json({ message: "unfollow success" });
      } else {
        return res.status(400).json({ message: "Already not following" });
      }
    } else {
      return res.status(400).json({ message: "You can't unfollow yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.acceptRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const receiver = await User.findById(req.user.id);
      const sender = await User.findById(req.params.id);
      if (receiver.requests.includes(sender._id)) {
        await receiver.update({
          $push: { friends: sender._id, following: sender._id },
        });
        await sender.update({
          $push: { friends: receiver._id, followers: receiver._id },
        });
        await receiver.updateOne({
          $pull: { requests: sender._id },
        });
        res.json({ message: "friend request accepted" });
      } else {
        return res.status(400).json({ message: "Already friends" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't accept a request from  yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.unfriend = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        receiver.friends.includes(sender._id) &&
        sender.friends.includes(receiver._id)
      ) {
        await receiver.update({
          $pull: {
            friends: sender._id,
            following: sender._id,
            followers: sender._id,
          },
        });
        await sender.update({
          $pull: {
            friends: receiver._id,
            following: receiver._id,
            followers: receiver._id,
          },
        });

        res.json({ message: "unfriend request accepted" });
      } else {
        return res.status(400).json({ message: "Already not friends" });
      }
    } else {
      return res.status(400).json({ message: "You can't unfriend yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.deleteRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const receiver = await User.findById(req.user.id);
      const sender = await User.findById(req.params.id);
      if (receiver.requests.includes(sender._id)) {
        await receiver.update({
          $pull: {
            requests: sender._id,
            followers: sender._id,
          },
        });
        await sender.update({
          $pull: {
            following: receiver._id,
          },
        });

        res.json({ message: "delete request accepted" });
      } else {
        return res.status(400).json({ message: "Already deleted" });
      }
    } else {
      return res.status(400).json({ message: "You can't delete yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.search = async (req, res) => {
  try {
    const searchTerm = req.params.searchTerm;
    const searchTermsArray = searchTerm.split(" ");

    // Arrays to store user and group search results
    const userResults = [];
    const groupResults = [];

    // Tìm kiếm từng từ riêng lẻ trong first_name và last_name của User
    for (const term of searchTermsArray) {
      const regexSearchResultsUser = await User.find({
        $or: [
          { first_name: { $regex: term, $options: "im" } },
          { last_name: { $regex: term, $options: "im" } },
        ],
      }).select("first_name last_name id picture friends requests");

      userResults.push(...regexSearchResultsUser);
    }

    // Tìm kiếm từng từ trong tên của Group
    for (const term of searchTermsArray) {
      const regexSearchResultsGroup = await Group.find({
        group_name: { $regex: term, $options: "im" },
      })
        .populate(
          "members.user",
          "first_name last_name picture friends requests id"
        )
        .populate(
          "pendingMembers.user",
          "first_name last_name picture friends requests id"
        ); // Add other fields you need from the Group model

      groupResults.push(...regexSearchResultsGroup);
    }

    // Combine user and group search results into a single array
    const combinedResults = [...userResults, ...groupResults];

    // Lọc kết quả để loại bỏ trùng lặp dựa trên user hoặc group id
    const filteredResults = combinedResults.filter(
      (result, index, self) =>
        index === self.findIndex((r) => r.id === result.id)
    );

    res.json({
      userResults,
      groupResults,
      combinedResults: filteredResults,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchFriends = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

exports.searchFriendsByBirthday = async (req, res) => {
  try {
    const searchTerm = req.params.searchTerm;
    const { dataByBirthday } = req.body;

    const searchResults = await User.find({
      _id: { $in: dataByBirthday },
      $or: [
        { first_name: { $regex: searchTerm, $options: "i" } }, // Tìm kiếm theo tên (không phân biệt chữ hoa chữ thường)
        { last_name: { $regex: searchTerm, $options: "i" } }, // Tìm kiếm theo họ (không phân biệt chữ hoa chữ thường)
      ],
    }).select(
      "first_name last_name daysToBirthdayMessage id picture friends followers requests following"
    );

    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addToSearchHistory = async (req, res) => {
  try {
    const { searchId, searchType } = req.body;
    if (searchType === "user") {
      const search = {
        user: searchId,
        type: searchType, // Assuming you have a field to differentiate between user and group searches
        createdAt: new Date(),
      };
      const user = await User.findById(req.user.id);
      const check = user.search.find(
        (x) => x.user && x.user.toString() === searchId
      );

      if (check) {
        await User.updateOne(
          {
            _id: req.user.id,
            "search._id": check._id,
          },
          {
            $set: { "search.$.createdAt": new Date() },
          }
        );
      } else {
        await User.findByIdAndUpdate(req.user.id, {
          $push: {
            search,
          },
        });
      }
    } else {
      const search = {
        group: searchId,
        type: searchType, // Assuming you have a field to differentiate between user and group searches
        createdAt: new Date(),
      };
      const user = await User.findById(req.user.id);
      const check = user.search.find(
        (x) => x.group && x.group.toString() === searchId
      );

      if (check) {
        await User.updateOne(
          {
            _id: req.user.id,
            "search._id": check._id,
          },
          {
            $set: { "search.$.createdAt": new Date() },
          }
        );
      } else {
        await User.findByIdAndUpdate(req.user.id, {
          $push: {
            search,
          },
        });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSearchHistory = async (req, res) => {
  try {
    const results = await User.findById(req.user.id)
      .select("search")
      .populate("search.user", "first_name last_name id picture")
      .populate("search.group", "group_name id cover");
    res.json(results.search);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.removeFromSearch = async (req, res) => {
  try {
    const { searchId, type } = req.body;
    if (type === "user") {
      await User.updateOne(
        {
          _id: req.user.id,
        },
        { $pull: { search: { user: searchId } } }
      );
    } else {
      await User.updateOne(
        {
          _id: req.user.id,
        },
        { $pull: { search: { group: searchId } } }
      );
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getFriendsPageInfos = async (req, res) => {
  try {
    const idUser = req.params.idUser;
    const user = await User.findById(idUser)
      .select("friends requests requests_group ")
      .populate("friends", "first_name last_name picture id")
      .populate("requests", "first_name last_name picture id")
      .populate({
        path: "requests_group",
        select: "senderRef groupRef",
        populate: [
          {
            path: "senderRef",
            select: "first_name last_name picture id",
          },
          {
            path: "groupRef",
            select: "group_name cover id",
          },
        ],
      });

    const sentRequests = await User.find({
      requests: mongoose.Types.ObjectId(idUser),
    }).select("first_name last_name picture id");

    res.json({
      friends: user.friends,
      requests: user.requests,
      sentRequests,
      requests_group: user.requests_group,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFriendsByBirthday = async (req, res) => {
  try {
    const idUser = req.params.idUser;
    const today = new Date(); // Ngày hiện tại
    const currentYear = today.getFullYear(); // Lấy năm hiện tại
    const currentMonth = today.getMonth() + 1; // Lấy tháng hiện tại (lưu ý rằng tháng bắt đầu từ 0)
    const currentDay = today.getDate(); // Lấy ngày hiện tại

    const daysInAdvance = 3; // Số ngày cần tìm kiếm trước ngày tháng năm sinh

    // Tìm bạn bè của người dùng
    const user = await User.findById(idUser); // Lấy thông tin của người dùng đang đăng nhập
    const friendIds = user.friends; // Lấy danh sách ID của bạn bè

    const friends = await User.find({
      _id: { $in: friendIds }, // Chỉ tìm trong danh sách bạn bè của người dùng hiện tại
      bYear: { $exists: true }, // Đảm bảo rằng có thông tin về năm sinh
      bMonth: { $exists: true }, // Đảm bảo rằng có thông tin về tháng sinh
      bDay: { $exists: true }, // Đảm bảo rằng có thông tin về ngày sinh
    }).select(
      "first_name last_name gender bYear bMonth bDay daysToBirthdayMessage picture friends requests"
    );

    // Tính toán số ngày còn lại đến sinh nhật và tạo thông điệp
    friends.forEach(async (friend) => {
      if (friend.bMonth === currentMonth) {
        friend.daysToBirthday = friend.bDay - currentDay;
      } else {
        friend.daysToBirthday = -1;
      }
      if (friend.daysToBirthday === 0) {
        if (friend.gender === "male") {
          friend.daysToBirthdayMessage = "Today is his birthday";
        } else {
          friend.daysToBirthdayMessage = "Today is her birthday";
        }
      } else if (friend.daysToBirthday === 1) {
        if (friend.gender === "male") {
          friend.daysToBirthdayMessage = "Tomorrow is his birthday";
        } else {
          friend.daysToBirthdayMessage = "Tomorrow is her birthday";
        }
      } else if (friend.daysToBirthday === 2) {
        friend.daysToBirthdayMessage = "Birthday is in 2 days";
      } else if (friend.daysToBirthday === 3) {
        friend.daysToBirthdayMessage = "Birthday is in 3 days";
      } else {
        friend.daysToBirthdayMessage = `Birthday is in ${friend.daysToBirthday} days`;
      }

      await User.updateOne(
        { _id: friend._id }, // Điều kiện tìm kiếm dựa trên ID của bạn bè
        { $set: { daysToBirthdayMessage: friend.daysToBirthdayMessage } }
      );
    });

    // Lọc danh sách bạn bè theo ngày tháng năm sinh
    const upcomingBirthdays = friends.filter((friend) => {
      return (
        friend.daysToBirthday >= 0 && friend.daysToBirthday <= daysInAdvance
      );
    });

    const comingBirthdays = friends.filter((friend) => {
      return (
        friend.daysToBirthday > 0 && friend.daysToBirthday <= daysInAdvance
      );
    });

    // Sắp xếp bạn bè theo ngày tháng năm sinh
    upcomingBirthdays.sort((a, b) => {
      const dateA = new Date(currentYear, a.bMonth - 1, a.bDay);
      const dateB = new Date(currentYear, b.bMonth - 1, b.bDay);
      return dateA - dateB;
    });

    comingBirthdays.sort((a, b) => {
      const dateA = new Date(currentYear, a.bMonth - 1, a.bDay);
      const dateB = new Date(currentYear, b.bMonth - 1, b.bDay);
      return dateA - dateB;
    });

    // Lọc danh sách bạn bè theo ngày sinh nhật hôm nay, ngày mai, ngày mốt
    const todayBirthdays = upcomingBirthdays.filter(
      (friend) => friend.daysToBirthday === 0
    );
    const tomorrowBirthdays = upcomingBirthdays.filter(
      (friend) => friend.daysToBirthday === 1
    );
    const dayAfterTomorrowBirthdays = upcomingBirthdays.filter(
      (friend) => friend.daysToBirthday === 2
    );

    res.json({
      upcomingBirthdays,
      todayBirthdays,
      tomorrowBirthdays,
      dayAfterTomorrowBirthdays,
      comingBirthdays,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGroupsJoined = async (req, res) => {
  try {
    const adminGroups = [];
    const memberGroups = [];
    const allGroups = await User.findById(req.user.id)
      .select("groups_joined")
      .populate(
        "groups_joined",
        "group_name public cover admins members numMembers id"
      );

    for (const group of allGroups.groups_joined) {
      const groupDetails = await Group.findById(group._id);
      const isUserAdmin = groupDetails.members.some(
        (member) => member.user.equals(req.user.id) && member.type === "admin"
      );

      if (isUserAdmin) {
        adminGroups.push(group);
      } else {
        memberGroups.push(group);
      }
    }

    res.json({
      adminGroups: adminGroups,
      memberGroups: memberGroups,
      allGroups: allGroups.groups_joined,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getdiscoverGroups = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const joinedGroups = user.groups_joined;

    const discoverGroups = await Group.find({
      _id: { $nin: joinedGroups },
      hidden: false,
    });

    res.json(discoverGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFriendsNotInGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.idgroup);
    const members = group.members.map((member) => member.user);

    const user = await User.findById(req.user.id)
      .select("friends ")
      .populate("friends", "first_name last_name picture groups_joined id");

    // Lọc danh sách bạn bè chưa thuộc nhóm và không phải là admin của nhóm

    const friendsNotInGroup = user.friends.filter(
      (friend) =>
        !members
          .map((member) => member.toString())
          .includes(friend._id.toString())
    );

    const friendIdsNotInGroup = friendsNotInGroup.map((friend) => friend.id);
    res.json({
      friendsNotInGroup: friendsNotInGroup,
      friendIdsNotInGroup: friendIdsNotInGroup,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchMembers = async (req, res) => {
  try {
    const data = [];
    const searchTerm = req.params.searchTerm;
    const { dataMembers } = req.body;
    for (const member of dataMembers) {
      data.push(member.user);
    }

    // Tìm kiếm bạn bè của người dùng có tên, họ, hoặc tên người dùng khớp với searchTerm
    const searchResults = await User.find({
      _id: { $in: data }, // Chỉ tìm trong danh sách bạn bè của người dùng hiện tại
      $or: [
        { first_name: { $regex: searchTerm, $options: "i" } }, // Tìm kiếm theo tên (không phân biệt chữ hoa chữ thường)
        { last_name: { $regex: searchTerm, $options: "i" } }, // Tìm kiếm theo họ (không phân biệt chữ hoa chữ thường)
      ],
    }).select("first_name last_name id friends requests picture");

    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const listIdPost = user.savedPosts.map((post) => post.post);

    // Truy xuất danh sách bài đăng đã lưu
    const savedPosts = await Post.find({ _id: { $in: listIdPost } })
      .populate("user", "first_name last_name picture id cover")
      .populate("group", "group_name cover id"); // Thêm các trường khác nếu cần

    res.json(savedPosts);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

