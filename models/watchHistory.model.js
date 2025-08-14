import mongoose from "mongoose";

const watchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: [true, "Video ID is required"],
    },

    watchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,     
    versionKey: false    
  }
);


watchHistorySchema.index({ userId: 1, videoId: 1 }, { unique: false });


watchHistorySchema.index({ userId: 1 });

export default mongoose.model("WatchHistory", watchHistorySchema);