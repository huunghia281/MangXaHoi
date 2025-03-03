const express = require("express");
const {
  creatGroup,
  sendRequest,
  getPageGroup,
  updateGroupCover,
  acceptInvite,
  deleteInvite,
  joingroup,
  leavegroup,
  followgroup,
  unfollowgroup,
  settingsgroup,
  approveMember,
  declineMember,
  cancelRequestGroup,
  pendingposts,
  approvependingposts,
  refusependingposts,
  removememberingroup,
  inviteasadmin,
  removeasadmin,
  cancelinviteasadmin,
  acceptinviteasadmin,
  getusersendinviteasadmin

} = require("../controllers/group");
const { authUser } = require("../middlwares/auth");

const router = express.Router();

router.post("/creatGroup", authUser, creatGroup);
router.put("/sendRequest", authUser, sendRequest);
router.get("/getPageGroup/:idgroup", authUser, getPageGroup);
router.put("/updateGroupCover/:idgroup", authUser, updateGroupCover);
router.put("/acceptInvite/:idgroup", authUser, acceptInvite);
router.put("/deleteInvite", authUser, deleteInvite);
router.put("/followgroup/:idgroup", authUser, followgroup);
router.put("/unfollowgroup/:idgroup", authUser, unfollowgroup);
router.get("/joingroup/:idgroup", authUser, joingroup);
router.get("/leavegroup/:idgroup", authUser, leavegroup);
router.put("/settingsgroup", authUser, settingsgroup);
router.put("/approveMember", authUser, approveMember);
router.put("/declineMember", authUser, declineMember);
router.put("/cancelRequestGroup", authUser, cancelRequestGroup);
router.put("/pendingposts", authUser, pendingposts);
router.put("/approvependingposts", authUser, approvependingposts);
router.put("/refusependingposts", authUser, refusependingposts);
router.put("/removememberingroup", authUser, removememberingroup);
router.put("/inviteasadmin", authUser, inviteasadmin);
router.put("/removeasadmin", authUser, removeasadmin);
router.put("/cancelinviteasadmin", authUser, cancelinviteasadmin);
router.put("/acceptinviteasadmin", authUser, acceptinviteasadmin);
router.put("/getusersendinviteasadmin", authUser, getusersendinviteasadmin);
module.exports = router;
