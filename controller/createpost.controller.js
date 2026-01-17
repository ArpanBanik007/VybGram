import Post from "../models/createpost.models.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";
import { View } from "../models/views.model.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudynary.js";
import escapeStringRegexp from "escape-string-regexp";
import ApiResponse from "../utils/ApiResponse.js";
import Like from "../models/likes.models.js";
import Dislike from "../models/dislikes.models.js";
import mongoose from "mongoose";

/**
 * Create Post (text + optional image)
 */
const createpost = asyncHandler(async (req, res) => {
  const { title, description,  isPublished } = req.body;
  const userId = req.user?._id;
  console.log("User ID:", userId); // ✅ এখানে debug করো

  // if (!title?.trim()) throw new ApiError(400, "Title is required");
  if (!description?.trim()) throw new ApiError(400, "Description is required");
  if (description.length > 1000) throw new ApiError(400, "Description must be under 1000 characters");
  // if (!Array.isArray(tags) || tags.some(tag => typeof tag !== "string")) {
  //   throw new ApiError(400, "Tags must be an array of strings");
  // }

  const publishStatus = typeof isPublished === "boolean" ? isPublished : false;

  // ✅ Handle optional image
  let postUrl = "";
  const postFile = req.files?.postFile ? req.files.postFile[0] : null
   console.log("📸 File received:", postFile);


   
  if (postFile) {
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedImageTypes.includes(postFile.mimetype)) {
      fs.unlinkSync(postFile.path);
      throw new ApiError(400, "Only image files (jpg, png, webp) are allowed");
    }
    const uploadPost = await uploadOnCloudinary(postFile.path, "posts");

    
    fs.unlink(postFile.path, () => {});
    if (!uploadPost?.url) throw new ApiError(500, "Post upload failed");
    postUrl = uploadPost.url;
  }

  const newPost = await Post.create({
    title: title.trim(),
    description: description.trim(),
    //tags,
    userId:userId,
    posturl: postUrl,
    isPublished: publishStatus,
    uploadedBy: userId,
    createdBy: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newPost, "Post uploaded successfully"));
});

/**
 * Update Post (text + optional image)
 */
const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { title, description, tags } = req.body;
  const userId = req.user?._id;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  if (post.uploadedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not allowed to update this post");
  }

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      throw new ApiError(400, "Title must be a non-empty string");
    }
    post.title = title.trim();
  }

  if (description !== undefined) {
    if (typeof description !== "string" || !description.trim()) {
      throw new ApiError(400, "Description must be a non-empty string");
    }
    if (description.length > 1000) {
      throw new ApiError(400, "Description must be under 1000 characters");
    }
    post.description = description.trim();
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags) || !tags.every((t) => typeof t === "string")) {
      throw new ApiError(400, "Tags must be an array of strings");
    }
    post.tags = tags;
  }

  // ✅ Optional image update
  const postFile = req.file;
  if (postFile) {
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedImageTypes.includes(postFile.mimetype)) {
      fs.unlinkSync(postFile.path);
      throw new ApiError(400, "Only image files (jpg, png, webp) are allowed");
    }
    const uploadPost = await uploadOnCloudinary(postFile.path, "posts");
    fs.unlink(postFile.path, () => {});
    if (post.posturl) await deleteFromCloudinary(post.posturl);
    post.posturl = uploadPost.url;
  }

  await post.save();
  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post updated successfully"));
});

/**
 * Delete Post
 */
const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user?._id;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  if (post.uploadedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not allowed to delete this post");
  }

  if (post.posturl) await deleteFromCloudinary(post.posturl);

  await post.deleteOne();

  return res.status(200).json(new ApiResponse(200, null, "Post deleted successfully"));
});

/**
 * Get Posts Feed
 */



const getPostsFeed = asyncHandler(async (req, res) => {
  const { lastPostId, limit = 10, search = "" } = req.query;
  const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 50);
const userId= req.user?._id;
  const query = {  }; // or {} for testing

  if (search.trim() !== "") {
    const escapedSearch = escapeStringRegexp(search.trim());
    const searchRegex = new RegExp(escapedSearch, "i");

    query.$or = [
      { title: { $regex: searchRegex } },
      { tags: { $elemMatch: { $regex: searchRegex } } },
      { "createdBy.username": { $regex: searchRegex } },
    ];
  }

  if (lastPostId) {
    const lastPost = await Post.findById(lastPostId).select("createdAt");
    if (lastPost) query.createdAt = { $lt: lastPost.createdAt };
  }

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(parsedLimit)
    .select("title posturl views createdAt tags createdBy")
    .populate("createdBy", "username fullName avatar")
    .lean();




   const postIds=posts.map(p=>p._id) ;


  const [userLikes, userDislikes] = await Promise.all([
  Like.find({ user: userId, post: { $in: postIds } }).lean(),
  Dislike.find({ user: userId, post: { $in: postIds } }).lean(),
]);

console.log("Likes",userLikes)
console.log("Dislikes",userDislikes)

// 3. Attach userLiked / userDisliked to each post
  const response = posts.map(post => ({
    ...post,
    userLiked: userLikes.some(l => l.post.toString() === post._id.toString()),
    userDisliked: userDislikes.some(d => d.post.toString() === post._id.toString()),
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, { posts: response}, "Filtered posts feed loaded successfully"));
});






// const getFeedposts = asyncHandler(async (req, res) => {
//   const userId = req.user._id; // logged-in user

//   const posts = await Post.aggregate([
//     {
//       $lookup: {
//         from: "likes",
//         let: { postId: "$_id" },
//         pipeline: [
//           {
//             $match: {
//               $expr: {
//                 $and: [
//                   { $eq: ["$post", "$$postId"] },
//                   { $eq: ["$user", userId] }
//                 ]
//               }
//             }
//           }
//         ],
//         as: "userLike"
//       }
//     },
//     {
//       $lookup: {
//         from: "dislikes",
//         let: { postId: "$_id" },
//         pipeline: [
//           {
//             $match: {
//               $expr: {
//                 $and: [
//                   { $eq: ["$post", "$$postId"] },
//                   { $eq: ["$user", userId] }
//                 ]
//               }
//             }
//           }
//         ],
//         as: "userDislike"
//       }
//     },
//     {
//       $addFields: {
//         userLiked: { $gt: [{ $size: "$userLike" }, 0] },
//         userDisliked: { $gt: [{ $size: "$userDislike" }, 0] }
//       }
//     }
//   ]);

//   return res
//     .status(200)
//     .json(new ApiResponse(200, { posts }, "Feed fetched successfully"));
// });



/**
 * Get Single Post
 */
const getSinglePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, "Invalid Post ID");
  }

  const post = await Post.findById(postId)
    .populate("createdBy", "username avatar")
    .lean();

  if (!post) throw new ApiError(404, "Post not found");

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Fetched single post successfully"));
});

/**
 * Toggle Like
 */


// Old version 
// const togglePostLike = asyncHandler(async (req, res) => {
//   const userId = req.user?._id;
//   const { postId } = req.params;

//   if (!userId || !postId) throw new ApiError(400, "PostId or UserId not found");

//   const alreadyLiked = await Like.findOne({ user: userId, post: postId });
//   if (alreadyLiked) {
//     await Like.deleteOne({ user: userId, post: postId });
//     await Post.findByIdAndUpdate(postId, { $inc: { likes: -1 } });
//   } else {
//     await Like.create({ user: userId, post: postId });
//     await Post.findByIdAndUpdate(postId, { $inc: { likes: 1 } });
//   }

//   return res.status(200).json(new ApiResponse(200, null, "Post like toggled successfully"));
// });

// New one 

// const togglePostLike = asyncHandler(async (req, res) => {
//   const userId = req.user?._id;
//   const { postId } = req.params;

//   if (!userId || !postId)
//     throw new ApiError(400, "PostId or UserId not found");

//   try {
//     // TRY LIKE
//     await Like.create({ user: userId, post: postId });

//     // remove dislike if exists
//     const disliked = await Dislike.deleteOne({ user: userId, post: postId });
//     if (disliked.deletedCount) {
//       // dislikes কখনো negative হবে না
//       await Post.findOneAndUpdate(
//         { _id: postId, dislikes: { $gt: 0 } },
//         { $inc: { dislikes: -1 } }
//       );
//     }

//     // likes increase
//     await Post.findOneAndUpdate(
//       { _id: postId },
//       { $inc: { likes: 1 } }
//     );

//     return res
//       .status(200)
//       .json(new ApiResponse(200, { liked: true }, "Post liked successfully"));

//   } catch (err) {
//     // duplicate → UNLIKE
//     if (err.code === 11000) {
//       await Like.deleteOne({ user: userId, post: postId });

//       // likes decrease, but never below 0
//       await Post.findOneAndUpdate(
//         { _id: postId, likes: { $gt: 0 } },
//         { $inc: { likes: -1 } }
//       );

//       return res
//         .status(200)
//         .json(new ApiResponse(200, { liked: false }, "Post unliked successfully"));
//     }
//     throw err;
//   }
// });







 const togglePostLike = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;

  try {
    // TRY LIKE
    await Like.create({ user: userId, post: postId });

    // remove dislike if exists
    const removed = await Dislike.deleteOne({ user: userId, post: postId });
    if (removed.deletedCount) {
      await Post.updateOne(
        { _id: postId, dislikes: { $gt: 0 } },
        { $inc: { dislikes: -1 } }
      );
    }

    await Post.updateOne(
      { _id: postId },
      { $inc: { likes: 1 } }
    );

    return res.json(
      new ApiResponse(200, { liked: true }, "Post liked")
    );

  } catch (err) {
    // duplicate → UNLIKE
    if (err.code === 11000) {
      await Like.deleteOne({ user: userId, post: postId });

      await Post.updateOne(
        { _id: postId, likes: { $gt: 0 } },
        { $inc: { likes: -1 } }
      );

      return res.json(
        new ApiResponse(200, { liked: false }, "Post unliked")
      );
    }
    throw err;
  }
});





/**
 * Toggle Dislike
 */

// Old one 


// const togglePostDislike = asyncHandler(async (req, res) => {
//   const { postId } = req.params;
//   const userId = req.user?._id;

//   if (!postId || !userId) throw new ApiError(400, "User ID or Post ID is missing");

//   const alreadyDisliked = await Dislike.findOne({ user: userId, post: postId });
//   if (alreadyDisliked) {
//     await Dislike.deleteOne({ user: userId, post: postId });
//     await Post.findByIdAndUpdate(postId, { $inc: { dislikes: -1 } });
//     return res.status(200).json(new ApiResponse(200, null, "Dislike removed successfully"));
//   } else {
//     await Dislike.create({ user: userId, post: postId });
//     await Post.findByIdAndUpdate(postId, { $inc: { dislikes: 1 } });
//     return res.status(200).json(new ApiResponse(200, null, "Disliked the post"));
//   }
// });

// New one 

const togglePostDislike = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { postId } = req.params;

  if (!userId || !postId)
    throw new ApiError(400, "PostId or UserId not found");

  try {
    // TRY DISLIKE
    await Dislike.create({ user: userId, post: postId });

    // remove like if exists
    const liked = await Like.deleteOne({ user: userId, post: postId });
    if (liked.deletedCount) {
      await Post.findByIdAndUpdate(postId, { $inc: { likes: -1 } });
    }

    // increment dislike
    await Post.findByIdAndUpdate(postId, { $inc: { dislikes: 1 } });

    // ApiResponse
    return res
      .status(200)
      .json(
        new ApiResponse(200, { disliked: true }, "Post disliked successfully")
      );

  } catch (err) {
    // duplicate → UNDISLIKE
    if (err.code === 11000) {
      await Dislike.deleteOne({ user: userId, post: postId });
      await Post.findByIdAndUpdate(postId, { $inc: { dislikes: -1 } });

      return res
        .status(200)
        .json(
          new ApiResponse(200, { disliked: false }, "Dislike removed successfully")
        );
    }

    throw err;
  }
});






/**
 * Add Post Views
 */
const addPostViews = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user?._id;
  const ip = req.ip;

  if (!postId || (!userId && !ip)) throw new ApiError(400, "Post ID or viewer info not found");

  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const existingView = await View.findOne({
    post: postId,
    $or: [
      userId ? { user: userId, createdAt: { $gte: sixHoursAgo } } : null,
      ip ? { ip, createdAt: { $gte: sixHoursAgo } } : null,
    ].filter(Boolean),
  });

  if (!existingView) {
    await View.create({ post: postId, user: userId, ip });
    await Post.findByIdAndUpdate(postId, { $inc: { views: 1 } });
  }

  return res.status(200).json(new ApiResponse(200, null, "View added successfully if viewer is new"));
});



const getOwnAllPosts = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  console.log("UserId",userId)
  if (!userId) throw new ApiError(401, "Unauthorized");

  const userPosts = await Post.find({ createdBy: userId,})
    .sort({ createdAt: -1 })
    .populate("createdBy", "username avatar")
    .lean();

  if (!userPosts || userPosts.length === 0) {
    return res.status(404).json({
      status: "fail",
      message: "No posts found for this user",
      data: [],
    });
  }

  return res.status(200).json({
    status: "success",
    message: "Fetched user's posts successfully",
    data: userPosts,
  });
});





const getOwnSinglePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user?._id;

  if (!postId || !userId) {
    throw new ApiError(400, "Post ID or User not found");
  }

  const userSinglePost = await Post.findOne({
    _id: postId,        
    createdBy: userId,  
  })
    .populate("createdBy", "username fullName avatar")
    .lean();

  if (!userSinglePost) {
    throw new ApiError(404, "No post found for this user");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, userSinglePost, "Fetched user's single post successfully")
    );
});


export {
  createpost,
  updatePost,
  deletePost,
  getSinglePost,
  getPostsFeed,
  togglePostLike,
  togglePostDislike,
  addPostViews,
  getOwnAllPosts,
  getOwnSinglePost,
  
};