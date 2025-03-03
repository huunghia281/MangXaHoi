const express = require("express");
const {
  register,
  activateAccount,
  login,
  auth,
  sendVerification,
  findUser,
  sendResetPasswordCode,
  validateResetCode,
  changePassword,
  getProfile,
  updateProfilePicture,
  updateCover,
  updateDetails,
  addFriend,
  cancelRequest,
  follow,
  unfollow,
  acceptRequest,
  unfriend,
  deleteRequest,
  search,
  searchFriends,
  searchMembers,
  searchFriendsByBirthday,
  addToSearchHistory,
  getSearchHistory,
  removeFromSearch,
  getFriendsPageInfos,
  getFriendsByBirthday,
  getUser,
  getGroupsJoined,
  getdiscoverGroups,
  getFriendsNotInGroup,
  getSavedPosts,
  validateVerifiCode
} = require("../controllers/user");
const { authUser } = require("../middlwares/auth");

const router = express.Router();

router.post("/register", register);
router.post("/activate", authUser, activateAccount);
router.post("/login", login);
router.post("/sendVerification", sendVerification);
router.post("/findUser", findUser);
router.post("/sendResetPasswordCode", sendResetPasswordCode);
router.post("/validateResetCode", validateResetCode);
router.post("/validateVerifiCode", validateVerifiCode);
router.post("/changePassword", changePassword);
router.get("/getProfile/:idUser", authUser, getProfile);
router.put("/updateProfilePicture", authUser, updateProfilePicture);
router.put("/updateCover", authUser, updateCover);
router.put("/updateDetails", authUser, updateDetails);
router.put("/addFriend/:id", authUser, addFriend);
router.put("/cancelRequest/:id", authUser, cancelRequest);
router.put("/follow/:id", authUser, follow);
router.put("/unfollow/:id", authUser, unfollow);
router.put("/acceptRequest/:id", authUser, acceptRequest);
router.put("/unfriend/:id", authUser, unfriend);
router.put("/deleteRequest/:id", authUser, deleteRequest);
router.post("/search/:searchTerm", authUser, search);
router.post("/searchFriends/:searchTerm", authUser, searchFriends);
router.post("/searchMembers/:searchTerm", authUser, searchMembers);
router.post("/searchFriendsByBirthday/:searchTerm", authUser, searchFriendsByBirthday);
router.put("/addToSearchHistory", authUser, addToSearchHistory);
router.get("/getSearchHistory", authUser, getSearchHistory);
router.put("/removeFromSearch", authUser, removeFromSearch);
router.get("/getFriendsPageInfos/:idUser", authUser, getFriendsPageInfos);
router.get("/getFriendsByBirthday/:idUser", authUser, getFriendsByBirthday);
router.get("/getUser", authUser, getUser);
router.get("/getGroupsJoined", authUser, getGroupsJoined);
router.get("/getdiscoverGroups", authUser, getdiscoverGroups);
router.get("/getFriendsNotInGroup/:idgroup", authUser, getFriendsNotInGroup);
router.get("/getSavedPosts", authUser, getSavedPosts);

module.exports = router;
