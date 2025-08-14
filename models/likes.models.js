const mongoose = require("mongoose");

// Define the Like schema
const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Quick search on user
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true, // Quick search on video
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true, // Ensures timestamp never changes
    },
  },
  {
    timestamps: false, // No updatedAt needed for Like
    versionKey: false, // __v field removed
  }
);

// Prevent duplicate likes from same user on same video
likeSchema.index({ user: 1, video: 1 }, { unique: true });

// Static method to check if user already liked the video
likeSchema.statics.isLiked = async function (userId, videoId) {
  return await this.exists({ user: userId, video: videoId });
};

 const Like = mongoose.model("Like", likeSchema);

 export default Like;
