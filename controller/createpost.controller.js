import Post from "../models/createpost.models.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs"
import { deleteFromCloudinary } from "../utils/deleteFromCloudynary.js";
import escapeStringRegexp from "escape-string-regexp";






const createpost= asyncHandler(async (req,res) => {
    const { title, description, tags = [],  isPublished } = req.body;
    const userId=req.user?._id;

      if (!title?.trim()) throw new ApiError(400, "Title is required");
      if (!description?.trim()) throw new ApiError(400, "Description is required");
      if (description.length > 1000) throw new ApiError(400, "Description must be under 1000 characters");

      if (!Array.isArray(tags) || tags.some(tag => typeof tag !== "string")) {
          throw new ApiError(400, "Tags must be an array of strings");
        }
      
     const publishStatus = typeof isPublished === "boolean" ? isPublished : false;


      const postFile= req.files?.posturl?.[0]  ;
      
      const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedImageTypes.includes(postFile.mimetype)) {
    fs.unlinkSync(postFile.path); // delete wrong file
    throw new ApiError(400, "Only image files (jpg, png, webp) are allowed for posts");
  }

       const postPath=postFile?.path;

       const uploadPost= await uploadOnCloudinary(postPath, "posts")

       fs.unlink(postPath,()=>{})

       if (!uploadPost?.url) throw new ApiError(500, "Post upload failed");

       const newPost= await Post.create({
        title:title.trim(),
        description:description.trim(),
        tags,
        posturl:uploadPost.url,
        isPublished:publishStatus,
        uploadedBy:userId,
        createdBy:userId
       })
       
  return res
    .status(201)
    .json(new ApiResponse(201, newPost, "Post uploaded successfully")); 
})



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

  await post.save();

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post updated successfully"));
});

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user?._id;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  if (post.uploadedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not allowed to delete this post");
  }

 
  if (post.posturl) {
    await deleteFromCloudinary(post.postUrl);
  }

  await post.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Post deleted successfully"));
});

const getPostsFeed = asyncHandler(async (req, res) => {
  const {
    lastPostId,
    limit = 10,
    search = "",
  } = req.query;

  const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 50);

  const query = {
    isPublished: true,
  };

  // 🔍 Search by title, tags, or creator.username
  if (search.trim() !== "") {
    const escapedSearch = escapeStringRegexp(search.trim());
    const searchRegex = new RegExp(escapedSearch, "i");

    query.$or = [
      { title: { $regex: searchRegex } },
      { tags: { $elemMatch: { $regex: searchRegex } } }, // ✅ fixed regex for tags
      { "creator.username": { $regex: searchRegex } },
    ];
  }

  // ⏳ Pagination using lastPostId
  if (lastPostId) {
    const lastPost = await Post.findById(lastPostId).select("createdAt");
    if (lastPost) {
      query.createdAt = { $lt: lastPost.createdAt };
    }
  }

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(parsedLimit)
    .select("title url views createdAt tags creator")
    .populate("creator", "username avatar")
    .lean();

  return res.status(200).json(
    new ApiResponse(200, { posts }, "Filtered posts feed loaded successfully") 
  );
});


export{
    createpost,
    updatePost,
    deletePost,
getPostsFeed,


}