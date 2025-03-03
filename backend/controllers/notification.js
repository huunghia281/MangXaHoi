const Notification = require("../models/Notification");
exports.createNotification = async (req, res) => {
  try {
    const { receiverId, type, postId, commentId, link, description, groupId } =
      req.body;

    const newNotification = new Notification({
      senderRef: req.user.id,
      receiverRef: receiverId,
      type: type,
      postRef: postId,
      commentRef: commentId,
      link: link,
      description: description,
      groupRef: groupId,
    });
    const newnotification = await newNotification.save();
    res.json({ newnotification });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getAllNotification = async (req, res) => {
  try {
    const notifications = await Notification.find({ receiverRef: req.user.id })
      .populate("senderRef", "first_name last_name picture id cover")
      .populate("postRef", "user")
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.setRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      read: true,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
