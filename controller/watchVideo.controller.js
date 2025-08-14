import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import watchHistoryModel from "../models/watchHistory.model.js";
import watchLaterModels from "../models/watchLater.models.js";




// History 

const createwatchHistory =asyncHandler(async (req,res) => {
    const userId=req.user._id;
    const {videoId}=req.body;

    if(!userId || !videoId){
      throw new ApiError(400, "User ID and VideoID is required")
    }


      if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }


    const watchHistory = await watchHistoryModel.findOneAndUpdate(
    { userId, videoId },
    { $set: { watchAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
 

    return res.status(200)
    .json(new ApiResponse(200, watchHistory,"Watch History created sucessfully"))

})


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
  const videoId = req.params.videoId || req.body.videoId;


  if (!userId || !videoId) {
    throw new ApiError(400, "User ID and Video ID are required");
  }


  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID format");
  }

  const alreadyExists = await watchLaterModels
    .findOne({ userId, videoId })
    .lean();

  if (alreadyExists) {
    return res.status(200).json(
      new ApiResponse(200, alreadyExists, "Video is already in Watch Later")
    );
  }


  const newWatchLater = await watchLaterModels.create({
    userId,
    videoId,
    AddAt: new Date(),
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      newWatchLater,
      "Video added to Watch Later successfully"
    )
  );
});


const deleteWatchLaterID = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const videoId = req.params.videoId || req.body.videoId;

  if (!userId || !videoId) {
    throw new ApiError(400, "User ID and Video ID are required");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  const deleteResult = await watchLaterModels.deleteOne({ userId, videoId });

  if (deleteResult.deletedCount === 0) {
    throw new ApiError(404, "Video not found in Watch Later");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video removed from Watch Later successfully"));
});



const getAllWatchLater = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 10), 100);
  const skip = (page - 1) * limit;

  const [watchLaterList, totalCount] = await Promise.all([
    watchLaterModels
      .find({ userId })
      .sort({ watchAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("videoId", "title thumbnail duration")
      .lean(),

    watchLaterModels.countDocuments({ userId }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        watchLater: watchLaterList,
        pagination: {
          totalItems: totalCount,
          currentPage: page,
          totalPages,
          limit,
        },
      },
      "Watch Later fetched successfully"
    )
  );
});














export{
createwatchHistory,
getAllWatchHistory,
deleteHistorybyID,
deleteAllHistory,
addWatchLater,
deleteWatchLaterID,
getAllWatchLater,
}