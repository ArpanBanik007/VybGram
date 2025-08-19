import asyncHandler from "../utils/asyncHandler.js"
import {User} from "../models/user.models.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import Video from "../models/video.model.js"
import { deleteFromCloudinary } from "../utils/deleteFromCloudynary.js"
import { getVideoDurationInSeconds } from "get-video-duration"
import escapeStringRegexp from 'escape-string-regexp';
import fs from "fs"
import { View } from "../models/views.model.js"
import Like from "../models/likes.models.js"

 const createVideo = asyncHandler(async (req, res) => {
  const { title, description, tags = [], category, isPublished } = req.body;
  const userId = req.user?._id;

  // ✅ Authentication check
  if (!userId) throw new ApiError(401, "Unauthorized access");

  const user = await User.findById(userId).select("_id");
  if (!user) throw new ApiError(401, "Authentication failed");

  // ✅ Input validations
  if (!title?.trim()) throw new ApiError(400, "Title is required");
  if (!description?.trim()) throw new ApiError(400, "Description is required");
  if (description.length > 1000) throw new ApiError(400, "Description must be under 1000 characters");
  if (!category?.trim()) throw new ApiError(400, "Category is required");

  if (!Array.isArray(tags) || tags.some(tag => typeof tag !== "string")) {
    throw new ApiError(400, "Tags must be an array of strings");
  }

  const publishStatus = typeof isPublished === "boolean" ? isPublished : false;

  // ✅ Files extraction
  const videoFile = req.files?.videoUrl?.[0];
  const thumbnailFile = req.files?.thumbnail?.[0];

  if (!videoFile?.path) throw new ApiError(400, "Video file is required");
 const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg", "video/mkv"];
  if (!allowedVideoTypes.includes(videoFile.mimetype)) {
    fs.unlinkSync(videoFile.path); 
    throw new ApiError(400, "Only video files (mp4, webm, ogg, mkv) are allowed");
  }

  const videoPath = videoFile.path;
  const thumbnailPath = thumbnailFile?.path;

  const durationInSeconds = await getVideoDurationInSeconds(videoPath);
  if (durationInSeconds > 180) {
    fs.unlinkSync(videoPath);
    throw new ApiError(400, "Video must be under 3 minutes");
  }
  // ✅ Upload to Cloudinary
  const [uploadedVideo, uploadedThumbnail] = await Promise.all([
    uploadOnCloudinary(videoPath, "videos/shorts"),
    thumbnailPath ? uploadOnCloudinary(thumbnailPath, "thumbnails") : null,
  ]);

  // Delete local files after upload
  fs.unlink(videoPath, () => {});
  if (thumbnailPath) fs.unlink(thumbnailPath, () => {});

  if (!uploadedVideo?.url) throw new ApiError(500, "Video upload failed");

  // ✅ Save video document
  const newVideo = await Video.create({
    title: title.trim(),
    description: description.trim(),
    tags,
    category: category.trim(),
    videoUrl: uploadedVideo.url,
    thumbnail: uploadedThumbnail?.url || "",
    isPublished: publishStatus,
    uploadedBy: userId,
    createdBy: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video uploaded successfully"));
});



const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, tags, category } = req.body;
  const userId = req.user?._id;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  // 🛡 Check ownership
  if (video.uploadedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  

  // ✅ Validations
  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      throw new ApiError(400, "Title must be a non-empty string");
    }
    video.title = title.trim();
  }

  if (description !== undefined) {
    if (typeof description !== "string" || !description.trim()) {
      throw new ApiError(400, "Description must be a non-empty string");
    }
    if (description.length > 1000) {
      throw new ApiError(400, "Description must be under 1000 characters");
    }
    video.description = description.trim();
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags) || !tags.every((t) => typeof t === "string")) {
      throw new ApiError(400, "Tags must be an array of strings");
    }
    video.tags = tags;
  }

  if (category !== undefined) {
    if (typeof category !== "string" || !category.trim()) {
      throw new ApiError(400, "Category must be a non-empty string");
    }
    video.category = category.trim();
  }

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});




const updateVideoThumbnail = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  const file = req.files?.thumbnail?.[0]?.path;

  if (!file) throw new ApiError(404, "Thumbnail file not found");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.userId.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  if (video.thumbnail) {
    await deleteFromCloudinary(video.thumbnail);
  }

  const newThumbnail = await uploadOnCloudinary(file);

  if (!newThumbnail || !newThumbnail.secure_url) {
    throw new ApiError(400, "New thumbnail upload failed");
  }

  video.thumbnail = newThumbnail.secure_url;
  await video.save();

  return res.status(200).json(
    new ApiResponse(200, video, "Thumbnail updated successfully")
  );
});



const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Find video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Authorization: owner or admin can delete
  if (video.userId.toString() !== userId.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  // Delete files from Cloudinary (ensure these are public IDs, not URLs)
  if (video.thumbnail) {
    await deleteFromCloudinary(video.thumbnail);
  }
  if (video.videourl) {
    await deleteFromCloudinary(video.videourl);
  }

  // Delete from DB
  await video.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});



  const getShortsFeed = asyncHandler(async (req, res) => {
  const {
    lastVideoId,
    limit = 10,
    search = "",
    category = "", // 🔥 added filter
  } = req.query;

  const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 50);

  const query = {
    isPublished: true,
    isShort: true,
  };

  // 🔍 Search by title, tags or creator.username (optional)
  if (search.trim() !== "") {
    const escapedSearch = escapeStringRegexp(search.trim());
    const searchRegex = new RegExp(escapedSearch, "i");

    query.$or = [
      { title: { $regex: searchRegex } },
      { tags: { $in: [searchRegex] } },
      { "creator.username": { $regex: searchRegex } }, // only if populated
    ];
  }

  // 🎯 Filter by category
  if (category.trim() !== "") {
    query.category = category.trim(); // optional: convert to lowercase
  }

  // ⏳ Pagination
  if (lastVideoId) {
    const lastVideo = await Video.findById(lastVideoId).select("createdAt");
    if (lastVideo) {
      query.createdAt = { $lt: lastVideo.createdAt };
    }
  }

  const videos = await Video.find(query)
    .sort({ createdAt: -1 })
    .limit(parsedLimit)
    .select("title url thumbnail views createdAt category tags creator")
    .populate("creator", "username avatar")
    .lean();

  return res.status(200).json(
    new ApiResponse(200, { videos }, "Filtered shorts feed loaded successfully")
  );
});


const getSingleVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // 1. ID validation
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID"); 
  }


  const video = await Video.findById(videoId)
    .populate("createdBy", "username avatar") 
    .lean(); 
  // 3. Not Found check
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // 4. Successful response
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Fetched single video successfully"));
});


const addViews = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  const ip = req.ip;

  if (!videoId || (!userId && !ip)) {
    throw new ApiError(400, "Video ID or viewer info not found");
  }

  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

  
  const existingView = await View.findOne({
    video: videoId,
    $or: [
      userId ? { user: userId, createdAt: { $gte: sixHoursAgo } } : null,
      ip ? { ip, createdAt: { $gte: sixHoursAgo } } : null,
    ].filter(Boolean), 
  });

  
  if (!existingView) {
    await View.create({ video: videoId, user: userId, ip }); 
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }); 
  }

  return res.status(200).json(
    new ApiResponse(200, null, "View added successfully if viewer is new")
  );
});



const toggleLikes = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const {videoId} = req.params; 


  if (!userId || !videoId) {
    throw new ApiError(400, "VideoId or UserId not found");
  }


  const alreadyLiked = await Like.isLiked(userId, videoId);

  if (alreadyLiked) {

    await Like.deleteOne({ user: userId, video: videoId });
 
    await Video.findByIdAndUpdate(videoId, { $inc: { likes: -1 } });


  }
   else {
    await Like.create({ user: userId, video: videoId });
    await Video.findByIdAndUpdate(videoId, { $inc: { likes: 1 } });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Like toggled successfully"));
});


 const toggleDislike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!videoId || !userId) {
    throw new ApiError(400, "User ID or Video ID is missing");
  }

  const alreadyDisliked = await Dislike.isDisliked(userId, videoId);

  if (alreadyDisliked) {

    await Dislike.deleteOne({ user: userId, video: videoId });

    await Video.findByIdAndUpdate(videoId, { $inc: { dislikes: -1 } });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Dislike removed successfully"));
  } 
  
  else {
   
    await Dislike.create({ user: userId, video: videoId });

    await Video.findByIdAndUpdate(videoId, { $inc: { dislikes: 1 } });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Disliked the video"));
  }
});  
export{
  createVideo,
  updateVideo,
  updateVideoThumbnail,
  deleteVideo,
  getShortsFeed,
  addViews,
  toggleLikes,
  toggleDislike,
  getSingleVideo,
  


}