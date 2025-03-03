const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Report = require("../models/Report");
const User = require("../models/User");
const Group = require("../models/Group");
const mongoose = require("mongoose");

exports.creatReport = async (req, res) => {
  try {
    const {
      postRef,
      commentRef,
      groupRef,
      to,
      type,
      groupReportedRef,
      userReportedRef,
    } = req.body;

    const newReport = await new Report({
      postRef,
      commentRef,
      groupRef,
      to,
      type,
      groupReportedRef,
      userReportedRef,
      userRef: req.user.id,
      createdAt: new Date(),
    }).save();

    res.status(200).json({
      newReport,
      message: "Create Report Success!",
    });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getReportsToGroup = async (req, res) => {
  try {
    const idgroup = req.params.idgroup;
    const reports = await Report.find({
      groupRef: idgroup,
      to: "adminGroup",
      st: null,
    })
      .populate({
        path: "postRef",
        select: "type text images background group user type createdAt",
        populate: {
          path: "user",
          select: "first_name last_name picture id",
        },
      })
      .populate("userRef", "first_name last_name id email")
      .populate({
        path: "commentRef",
        select: "comment image commentAt",
        populate: {
          path: "commentBy",
          select: "first_name last_name picture id",
        },
      });

    reports.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });

    // Now, `reports` contains the populated data with the desired fields from the "user" reference.
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error getting reports:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.getReportsToAdmin = async (req, res) => {
  try {
    const reports = await Report.find({
      to: "adminFacebook",
    })
      .populate({
        path: "postRef",
        select: "type text images background group user type createdAt",
        populate: {
          path: "user",
          select: "first_name last_name picture id",
        },
      })
      .populate("userRef", "first_name last_name id email")
      .populate({
        path: "commentRef",
        select: "comment image commentAt",
        populate: {
          path: "commentBy",
          select: "first_name last_name picture id",
        },
      })
      .populate("groupReportedRef", "group_name cover id ")
      .populate({
        path: "userReportedRef",
        select: "first_name last_name id email friends",
        populate: {
          path: "friends",
          select: "first_name last_name picture id",
        },
      });

    reports.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });

    // Now, `reports` contains the populated data with the desired fields from the "user" reference.
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error getting reports:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.keepReport = async (req, res) => {
  try {
    const { idreport } = req.body;

    await Report.findByIdAndUpdate(idreport, { st: "keep" });
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.getReportById = async (req, res) => {
  const { idreport } = req.params;
  try {
    const report = await Report.findById(idreport)
      .populate({
        path: "postRef",
        select: "type text images background group user type createdAt id",
        populate: {
          path: "user",
          select: "first_name last_name picture cover id",
        },
      })
      .populate("userRef", "first_name last_name id email")
      .populate({
        path: "commentRef",
        select: "comment image commentAt id",
        populate: {
          path: "commentBy",
          select: "first_name last_name picture id",
        },
      })
      .populate({
        path: "groupReportedRef",
        select: "group_name  id  friends cover members public ",
        populate: {
          path: "members.user",
          select: "first_name last_name picture  id",
        },
      })
      .populate({
        path: "userReportedRef",
        select: "first_name last_name id email friends cover picture details",
        populate: {
          path: "friends",
          select: "first_name last_name picture id",
        },
      });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json(report);
  } catch (error) {
    console.error("Error getting report by ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.removeReport = async (req, res) => {
  try {
    const { postRef, idreport, commentRef ,userReportedRef , groupReportedRef } = req.body;
    if (postRef) {
      await Post.findByIdAndUpdate(postRef, { st: "delete" });
    }
    if (commentRef) {
      await Comment.findByIdAndUpdate(commentRef, { st: "delete" });
    }
    if (userReportedRef) {
      await User.findByIdAndUpdate(userReportedRef, { isBaned: true });
    }
    if (groupReportedRef) {
      await Group.findByIdAndUpdate(groupReportedRef, { isBaned: true });
    }
    await Report.findByIdAndUpdate(idreport, { st: "remove" });
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};




