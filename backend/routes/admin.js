const express = require("express");
const { getAllUsers , getAllGroups } = require("../controllers/admin");
const { authUser } = require("../middlwares/auth");

const router = express.Router();

router.get("/getAllUsers", authUser, getAllUsers);
router.get("/getAllGroups", authUser, getAllGroups);

module.exports = router;
