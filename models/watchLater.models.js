import mongoose from "mongoose";

const watchLaterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
     
    },
    
    AddAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,  // adds createdAt and updatedAt
    versionKey: false, // removes __v
  }
);

// Compound index to prevent duplicate entries
watchLaterSchema.index({ userId: 1, videoId: 1 }, { unique: true, sparse: true });

export default mongoose.model("WatchLater", watchLaterSchema);