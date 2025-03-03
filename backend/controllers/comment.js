const Comment = require("../models/Comment");

exports.comment = async (req, res) => {
  try {
    const { postId, comment, image } = req.body;

    const newComment = new Comment({
      comment: comment,
      postRef: postId,
      commentRef: null,
      image: image,
      commentBy: req.user.id,
      commentAt: new Date(),
    });
    const savedComment = await newComment.save();

    let newComments = await Comment.find({ postRef: postId }).populate(
      "commentBy",
      "picture first_name last_name id"
    );
    res.json({ savedComment: savedComment, newComments: newComments });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.commentInComment = async (req, res) => {
  try {
    const { commentId, comment, image } = req.body;

    const newComment = new Comment({
      comment: comment,
      postRef: null,
      commentRef: commentId,
      image: image,
      commentBy: req.user.id,
      commentAt: new Date(),
    });
    const savedComment = await newComment.save();

    let newComments = await Comment.find({ commentRef: commentId })
      .populate("commentBy", "picture first_name last_name id")
      .populate({
        path: "commentRef",
        populate: {
          path: "commentBy",
          select: "first_name last_name id",
        },
      });
    res.json({ savedComment: savedComment, newComments: newComments });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getComment = async (req, res) => {
  try {
    const comments = await Comment.find({ postRef: req.params.id , st: null}).populate(
      "commentBy",
      "picture first_name last_name id"
    );
    comments.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });
    res.json(comments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


exports.getCountCommentInPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentCount = await getCommentCount(postId);
    res.json(commentCount );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

async function getCommentCount(postId) {
  const comments = await Comment.find({ postRef: postId , st: null});
  let commentCount = comments.length;

  async function findNestedCommentCount(parentComment) {
    const nestedComments = await Comment.find({ commentRef: parentComment._id  , st: null});
    commentCount += nestedComments.length;

    for (const nestedComment of nestedComments) {
      await findNestedCommentCount(nestedComment);
    }
  }

  for (const comment of comments) {
    await findNestedCommentCount(comment);
  }

  return commentCount;
}





exports.getCommentInComment = async (req, res) => {
  try {
    const comments = await Comment.find({ commentRef: req.params.id ,  st: null})
      .populate("commentBy", "picture first_name last_name id")
      .populate({
        path: "commentRef",
        populate: {
          path: "commentBy",
          select: "first_name last_name id",
        },
      });
    comments.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });
    res.json(comments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
