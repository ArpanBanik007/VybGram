import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import watchHistoryModel from "../models/watchHistory.model.js";
import watchLaterModels from "../models/watchLater.models.js";
import mongoose from "mongoose";




// History 


const getAllWatchHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); 
  const skip = (page - 1) * limit;

  
  const [watchHistory, totalCount] = await Promise.all([
   watchHistoryModel.find({ userId })
      .sort({ watchAt: -1 }) // most recent first
      .skip(skip)
      .limit(limit)
      .populate("videoId", "title thumbnail duration") 
      .lean(),

    watchHistoryModel.countDocuments({ userId }) 
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      watchHistory,
      pagination: {
        totalItems: totalCount,
        currentPage: page,
        totalPages,
        limit,
      },
    }, "Watch History fetched successfully")
 );
});


const deleteHistorybyID = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { videoId } = req.body;

  // Validate inputs
  if (!userId || !videoId) {
    throw new ApiError(400, "User ID and Video ID are required");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Delete watch history
  const deleteHistory = await watchHistoryModel.deleteOne({ userId, videoId });

  // Check if deletion happened
  if (deleteHistory.deletedCount === 0) {
    throw new ApiError(404, "No watch history found to delete");
  }

  // Success response
  return res
    .status(200)
    .json(new ApiResponse(200, null, "History deleted successfully"));
});


const deleteAllHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const { deletedCount } = await watchHistoryModel.deleteMany({ userId });

  if (deletedCount === 0) {
    throw new ApiError(404, "No watch history found to delete");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { deletedCount }, "All watch history deleted successfully"));
});







// Watch Later 

const addWatchLater = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const videoId = req.query.videoId || req.body.videoId;
  const postId = req.query.postId || req.body.postId;

  // ✅ user check
  if (!userId) {
    throw new ApiError(400, "UserId is required");
  }

  // ✅ must have either postId or videoId
  if (!postId && !videoId) {
    throw new ApiError(400, "Either postId or videoId is required");
  }

  // ✅ Validate only the provided ones
  if (videoId && !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID format");
  }

  if (postId && !mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, "Invalid Post ID format");
  }

  // ✅ Check if already exists
  const alreadyExists = await watchLaterModels.findOne({
    userId,
    $or: [
      videoId ? { videoId } : {},
      postId ? { postId } : {},
    ],
  }).lean();

  if (alreadyExists) {
    return res.status(200).json(
      new ApiResponse(200, alreadyExists, "Video or Post is already in Watch Later")
    );
  }

  // ✅ Create a new WatchLater record safely
  const newWatchLater = await watchLaterModels.create({
    userId,
    videoId: videoId || undefined, // only saves if present
    postId: postId || undefined,   // only saves if present
    watchAt: new Date(),
  });

  return res.status(201).json(
    new ApiResponse(201, newWatchLater, "Video or Post added to Watch Later successfully")
  );
});




// createwatchHistory,

export{
getAllWatchHistory,
deleteHistorybyID,
deleteAllHistory,
addWatchLater,
deleteWatchLaterID,
getAllWatchLater,
}