import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Comment from "../models/comments.models.js"
import Post from "../models/createpost.models.js";




const createPostComment = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { content, parentComment } = req.body;
  const { postId } = req.params; // Post ID path theke ashbe

  // Validation
  if (!postId || !userId || !content || content.trim() === "") {
    throw new ApiError(400, "Post ID, User ID, and valid content are required");
  }

  // Check Post exists or not
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // If reply to another comment
  let parent = null;
  if (parentComment) {
    parent = await Comment.findById(parentComment);
    if (!parent) {
      throw new ApiError(404, "Parent comment not found");
    }

    // Ensure parent comment belongs to the same post
    if (String(parent.post) !== postId) {
      throw new ApiError(400, "Parent comment does not belong to this post");
    }
  }

  // Create new comment
  const newComment = await Comment.create({
    content: content.trim(),
    user: userId,
    post: postId, // ekhane video na, post use korte hobe
    parentComment: parentComment || null,
  });

  // Update comment count in Post
  await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

  return res
    .status(201)
    .json(new ApiResponse(201, newComment, "Comment posted successfully on Post"));
});


const getAllCommentsForPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  // ✅ Check if post exists
  const postExists = await Post.findById(postId);
  if (!postExists) {
    throw new ApiError(404, "Post not found");
  }

  // ✅ Fetch top-level comments (only parent=null)
  const comments = await Comment.find({
    post: postId,
    parentComment: null,
  })
    .populate("user", "username avatar")
    .sort({ createdAt: -1 }) // latest first
    .skip(skip)
    .limit(limit)
    .lean();

  // ✅ Count replies for each comment
  const commentIds = comments.map((c) => c._id);
  const replyCounts = await Comment.aggregate([
    { $match: { parentComment: { $in: commentIds } } },
    { $group: { _id: "$parentComment", count: { $sum: 1 } } },
  ]);

  const replyCountMap = {};
  for (const rc of replyCounts) {
    replyCountMap[rc._id.toString()] = rc.count;
  }

  // ✅ Attach replyCount to each comment
  const commentsWithReplyCount = comments.map((c) => ({
    ...c,
    replyCount: replyCountMap[c._id.toString()] || 0,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, commentsWithReplyCount, "Main comments fetched for post"));
});


// ✅ Fetch Replies for a Comment under a Post
const getRepliesByCommentIdForPost = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!commentId) {
    throw new ApiError(400, "Comment ID is required");
  }

  // ✅ Ensure parent comment exists
  const parentComment = await Comment.findById(commentId);
  if (!parentComment) {
    throw new ApiError(404, "Parent comment not found");
  }

  // ✅ Fetch paginated replies
  const replies = await Comment.find({ parentComment: commentId })
    .populate("user", "username avatar")
    .sort({ createdAt: 1 }) // oldest first
    .skip(skip)
    .limit(limit)
    .lean();

  // ✅ Count total replies (for frontend pagination)
  const totalReplies = await Comment.countDocuments({ parentComment: commentId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        replies,
        currentPage: page,
        totalReplies,
        totalPages: Math.ceil(totalReplies / limit),
      },
      "Replies fetched for post"
    )
  );
});


// ✅ Reply to a comment under a Post
const commentReplyForPost = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;

  if (!commentId || !content?.trim()) {
    return res.status(400).json(
      new ApiResponse(400, null, "Parent comment ID and content are required")
    );
  }

  // Check if parent comment exists
  const parentComment = await Comment.findById(commentId).lean();
  if (!parentComment) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Parent comment not found"));
  }

  // ✅ Create reply with post reference
  const reply = await Comment.create({
    content: content.trim(),
    user: userId,
    parentComment: commentId,
    post: parentComment.post, // important
  });

  await reply.populate("user", "username avatar");

  return res
    .status(201)
    .json(new ApiResponse(201, reply, "Reply posted successfully"));
});


// ✅ Update a comment under Post
const updateCommentForPost = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      post: postId,
      user: userId,
    },
    { $set: { content: content.trim() } },
    { new: true, runValidators: true }
  ).populate("user", "username avatar");

  if (!updatedComment) {
    throw new ApiError(
      404,
      "Comment not found or you're not authorized to update this comment"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedComment, "Comment updated successfully")
    );
});


// ✅ Delete a comment under Post
const deleteCommentForPost = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user._id;

  const comment = await Comment.findOne({
    _id: commentId,
    post: postId,
    user: userId,
  });

  if (!comment) {
    throw new ApiError(
      404,
      "Comment not found or you're not authorized to delete it"
    );
  }

  // Delete the comment + its replies
  await comment.deleteOne();
  await Comment.deleteMany({ parentComment: commentId });

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Comment and its replies deleted successfully")
    );
});


// ✅ Toggle like on comment under Post
const toggleLikeOnCommentForPost = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const alreadyLiked = await Comment.exists({
    _id: commentId,
    likes: userId,
  });

  let updatedComment;
  if (alreadyLiked) {
    updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { $pull: { likes: userId }, $inc: { likesCount: -1 } },
      { new: true }
    );
  } else {
    updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { $addToSet: { likes: userId }, $inc: { likesCount: 1 } },
      { new: true }
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: updatedComment._id,
        likesCount: updatedComment.likesCount,
        likedByCurrentUser: !alreadyLiked,
      },
      alreadyLiked ? "Unliked the comment" : "Liked the comment"
    )
  );
});



export {
    createPostComment,
    getAllCommentsForPost,
    getRepliesByCommentIdForPost,
    updateCommentForPost,
    toggleLikeOnCommentForPost,
    commentReplyForPost,
    deleteCommentForPost
}