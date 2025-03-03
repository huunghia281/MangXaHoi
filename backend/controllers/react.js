const React = require("../models/React");
const User = require("../models/User");
const mongoose = require("mongoose");
exports.reactPost = async (req, res) => {
  try {
    const { postId, react } = req.body;
    const check = await React.findOne({
      postRef: postId,
      reactBy: mongoose.Types.ObjectId(req.user.id),
    });
    if (check == null) {
      const newReact = new React({
        react: react,
        postRef: postId,
        commentRef: null,
        messRef: null,
        reactBy: req.user.id,
      });
      await newReact.save();
    } else {
      if (check.react == react) {
        await React.findByIdAndRemove(check._id);
      } else {
        await React.findByIdAndUpdate(check._id, {
          react: react,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.reactComment = async (req, res) => {
  try {
    const { commentId, react } = req.body;
    const check = await React.findOne({
      commentRef: commentId,
      reactBy: mongoose.Types.ObjectId(req.user.id),
    });
    if (check == null) {
      const newReact = new React({
        react: react,
        postRef: null,
        commentRef: commentId,
        messRef: null,
        reactBy: req.user.id,
      });
      await newReact.save();
    } else {
      if (check.react == react) {
        await React.findByIdAndRemove(check._id);
      } else {
        await React.findByIdAndUpdate(check._id, {
          react: react,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.reactMess = async (req, res) => {
  try {
    const { messId, react } = req.body;
    const check = await React.findOne({
      messRef: messId,
      reactBy: mongoose.Types.ObjectId(req.user.id),
    });
    if (check == null) {
      const newReact = new React({
        react: react,
        postRef: null,
        commentRef: null,
        messRef: messId,
        reactBy: req.user.id,
      });
      await newReact.save();
    } else {
      if (check.react == react) {
        await React.findByIdAndRemove(check._id);
      } else {
        await React.findByIdAndUpdate(check._id, {
          react: react,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


exports.getReactsPost = async (req, res) => {
  try {
    const reactsArray = await React.find({ postRef: req.params.id }).populate("reactBy", "first_name last_name id picture friends requests");;

    /*
    const check1 = reacts.find(
      (x) => x.reactBy.toString() == req.user.id
    )?.react;
    */
    const newReacts = reactsArray.reduce((group, react) => {
      let key = react["react"];
      group[key] = group[key] || [];
      group[key].push(react);
      return group;
    }, {});

    const reacts = [
      {
        react: "Like",
        count: newReacts.Like ? newReacts.Like.length : 0,
        users: newReacts.Like
          ? newReacts.Like.map((react) => react.reactBy)
          : [],
      },
      {
        react: "Love",
        count: newReacts.Love ? newReacts.Love.length : 0,
        users: newReacts.Love
          ? newReacts.Love.map((react) => react.reactBy)
          : [],
      },
      {
        react: "Haha",
        count: newReacts.Haha ? newReacts.Haha.length : 0,
        users: newReacts.Haha
          ? newReacts.Haha.map((react) => react.reactBy)
          : [],
      },
      {
        react: "Sad",
        count: newReacts.Sad ? newReacts.Sad.length : 0,
        users: newReacts.Sad ? newReacts.Sad.map((react) => react.reactBy) : [],
      },
      {
        react: "Wow",
        count: newReacts.Wow ? newReacts.Wow.length : 0,
        users: newReacts.Wow ? newReacts.Wow.map((react) => react.reactBy) : [],
      },
      {
        react: "Angry",
        count: newReacts.Angry ? newReacts.Angry.length : 0,
        users: newReacts.Angry
          ? newReacts.Angry.map((react) => react.reactBy)
          : [],
      },
    ];

    const check = await React.findOne({
      postRef: req.params.id,
      reactBy: req.user.id,
    });
    const user = await User.findById(req.user.id);
    const checkSaved = user?.savedPosts.find(
      (x) => x.post.toString() === req.params.id
    );
    const typeArr = reacts.filter((react) => react.count > 0);
    const mostReacted = reacts.reduce((prev, current) =>
      prev.count > current.count ? prev : current
    );
    res.json({
      reacts,
      reactsArray,
      check: check?.react,
      total: reactsArray.length,
      totalType: typeArr.length,
      TypeHigh: mostReacted.react,
      checkSaved: checkSaved ? true : false,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getReactsComment = async (req, res) => {
  try {
    const reactsArray = await React.find({ commentRef: req.params.id }).populate("reactBy", "first_name last_name id picture friends requests");;

    /*
    const check1 = reacts.find(
      (x) => x.reactBy.toString() == req.user.id
    )?.react;
    */
    const newReacts = reactsArray.reduce((group, react) => {
      let key = react["react"];
      group[key] = group[key] || [];
      group[key].push(react);
      return group;
    }, {});

    const reacts = [
      {
        react: "Like",
        count: newReacts.Like ? newReacts.Like.length : 0,
        users: newReacts.Like
          ? newReacts.Like.map((react) => react.reactBy)
          : [],
      },
      {
        react: "Love",
        count: newReacts.Love ? newReacts.Love.length : 0,
        users: newReacts.Love
          ? newReacts.Love.map((react) => react.reactBy)
          : [],
      },
      {
        react: "Haha",
        count: newReacts.Haha ? newReacts.Haha.length : 0,
        users: newReacts.Haha
          ? newReacts.Haha.map((react) => react.reactBy)
          : [],
      },
      {
        react: "Sad",
        count: newReacts.Sad ? newReacts.Sad.length : 0,
        users: newReacts.Sad ? newReacts.Sad.map((react) => react.reactBy) : [],
      },
      {
        react: "Wow",
        count: newReacts.Wow ? newReacts.Wow.length : 0,
        users: newReacts.Wow ? newReacts.Wow.map((react) => react.reactBy) : [],
      },
      {
        react: "Angry",
        count: newReacts.Angry ? newReacts.Angry.length : 0,
        users: newReacts.Angry
          ? newReacts.Angry.map((react) => react.reactBy)
          : [],
      },
    ];

    const check = await React.findOne({
      commentRef: req.params.id,
      reactBy: req.user.id,
    });
    const user = await User.findById(req.user.id);
    const checkSaved = user?.savedPosts.find(
      (x) => x.post.toString() === req.params.id
    );
    const typeArr = reacts.filter((react) => react.count > 0);
    const mostReacted = reacts.reduce((prev, current) =>
    prev.count > current.count ? prev : current
  );
    res.json({
      reacts,
      reactsArray,
      check: check?.react,
      total: reactsArray.length,
      totalType: typeArr.length,
      TypeHigh: mostReacted.react,
      checkSaved: checkSaved ? true : false,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getReactsMess = async (req, res) => {
  try {
    const reactsArray = await React.find({ messRef: req.params.id }).populate("reactBy", "first_name last_name id picture friends requests");;

    /*
    const check1 = reacts.find(
      (x) => x.reactBy.toString() == req.user.id
    )?.react;
    */
    const newReacts = reactsArray.reduce((group, react) => {
      let key = react["react"];
      group[key] = group[key] || [];
      group[key].push(react);
      return group;
    }, {});

    const reacts = [
      {
        react: "Like",
        count: newReacts.Like ? newReacts.Like.length : 0,
        users: newReacts.Like
          ? newReacts.Like.map((react) => react.reactBy)
          : [],
      },
      {
        react: "Love",
        count: newReacts.Love ? newReacts.Love.length : 0,
        users: newReacts.Love
          ? newReacts.Love.map((react) => react.reactBy)
          : [],
      },
      {
        react: "Haha",
        count: newReacts.Haha ? newReacts.Haha.length : 0,
        users: newReacts.Haha
          ? newReacts.Haha.map((react) => react.reactBy)
          : [],
      },
      {
        react: "Sad",
        count: newReacts.Sad ? newReacts.Sad.length : 0,
        users: newReacts.Sad ? newReacts.Sad.map((react) => react.reactBy) : [],
      },
      {
        react: "Wow",
        count: newReacts.Wow ? newReacts.Wow.length : 0,
        users: newReacts.Wow ? newReacts.Wow.map((react) => react.reactBy) : [],
      },
      {
        react: "Angry",
        count: newReacts.Angry ? newReacts.Angry.length : 0,
        users: newReacts.Angry
          ? newReacts.Angry.map((react) => react.reactBy)
          : [],
      },
    ];

    const check = await React.findOne({
      messRef: req.params.id,
      reactBy: req.user.id,
    });
    const user = await User.findById(req.user.id);
    const checkSaved = user?.savedPosts.find(
      (x) => x.post.toString() === req.params.id
    );
    const typeArr = reacts.filter((react) => react.count > 0);
    const mostReacted = reacts.reduce((prev, current) =>
    prev.count > current.count ? prev : current
  );
    res.json({
      reacts,
      reactsArray,
      check: check?.react,
      total: reactsArray.length,
      totalType: typeArr.length,
      TypeHigh: mostReacted.react,
      checkSaved: checkSaved ? true : false,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



