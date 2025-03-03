const express = require("express");
const {
  creatReport,
  getReportsToGroup,
  getReportsToAdmin,
  keepReport,
  removeReport,
  getReportById
} = require("../controllers/report");
const { authUser } = require("../middlwares/auth");

const router = express.Router();
router.put("/creatReport", authUser, creatReport);
router.get("/getReportsToGroup/:idgroup", authUser, getReportsToGroup);
router.get("/getReportsToAdmin", authUser, getReportsToAdmin);
router.put("/keepReport", authUser, keepReport);
router.put("/removeReport", authUser, removeReport);
router.get("/getReportById/:idreport", authUser, getReportById);
module.exports = router;
