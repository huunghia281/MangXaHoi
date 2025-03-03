const Post = require("../models/Post");
const User = require("../models/User");

exports.createPost = async (req, res) => {
  try {
    const post = await new Post(req.body).save();
    await post.populate("user", "first_name last_name cover picture id");
    if (post && post.group) {
      await post.populate("group", "group_name cover id");
    }

    res.json(post);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const followingTemp = await User.findById(req.user.id).select("following");
    const groupTemp = await User.findById(req.user.id).select(
      "groups_following"
    );
    const following = followingTemp.following;
    const groups_following = groupTemp.groups_following;
    const promises = following.map((user) => {
        return Post.find({
          user: user,
          group: null,
          st: null,
          type: { $ne: "pending" },
        })
          .populate("user", "first_name last_name picture id cover")
          .sort({ createdAt: -1 });
    });
    const promisesGroup = groups_following.map((group) => {
      return Post.find({ group: group, st: null, type: { $ne: "pending" } })
        .populate("user", "first_name last_name picture id cover")
        .populate("group", "group_name cover id ")
        .sort({ createdAt: -1 });
    });
    const followingPosts = await (await Promise.all(promises)).flat();
    const groups_followingPosts = await (
      await Promise.all(promisesGroup)
    ).flat();
    const userPosts = await Post.find({
      user: req.user.id,
      group: null,
      st: null,
      type: { $ne: "pending" },
    })
      .populate("user", "first_name last_name picture id cover")
      .sort({ createdAt: -1 });

    followingPosts.push(...[...userPosts]);
    followingPosts.push(...[...groups_followingPosts]);
    followingPosts.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });
    res.json(followingPosts);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "user",
      "first_name last_name picture id cover"
    );

    // Kiểm tra nếu post tồn tại và có trường group
    if (post && post.group) {
      await post.populate("group", "group_name picture id");
    }

    res.json(post);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.savePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const user = await User.findById(req.user.id);
    const check = user?.savedPosts.find(
      (post) => post.post.toString() == postId
    );
    if (check) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: {
          savedPosts: {
            _id: check._id,
          },
        },
      });
    } else {
      await User.findByIdAndUpdate(req.user.id, {
        $push: {
          savedPosts: {
            post: postId,
            savedAt: new Date(),
          },
        },
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndRemove(req.params.id);
    res.json({ status: "ok" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getpostgroups = async (req, res) => {
  try {
    const groupTemp = await User.findById(req.user.id).select(
      "groups_following"
    );
    const groups_following = groupTemp.groups_following;
    const promisesGroup = groups_following.map((idgroup) => {
      return Post.find({ group: idgroup, st: null, type: { $ne: "pending" } })
        .populate("user", "first_name last_name picture id cover")
        .populate("group", "group_name cover id ")
        .sort({ createdAt: -1 })
        .limit(10);
    });
    const groups_followingPosts = await (
      await Promise.all(promisesGroup)
    ).flat();
    groups_followingPosts.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });
    res.json(groups_followingPosts);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getPostByUrl = async (req, res) => {
  try {
    const { url } = req.body;
    const post = await Post.findOne({
      images: { $elemMatch: { url: url } },
      type: { $ne: "pending" },
      st: null,
    }).populate("user", "first_name last_name picture id cover");

    // Kiểm tra nếu post tồn tại và có trường group
    if (post && post.group) {
      await post.populate("group", "group_name picture id");
    }

    res.json(post);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
