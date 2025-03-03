const express = require("express");
const { createNotification , getAllNotification , setRead} = require("../controllers/notification");
const { authUser } = require("../middlwares/auth");

const router = express.Router();
router.put("/createNotification", authUser, createNotification);
router.get("/getAllNotification", authUser, getAllNotification);
router.put("/setRead/:id", authUser, setRead);
module.exports = router;
