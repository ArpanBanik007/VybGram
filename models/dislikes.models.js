import mongoose from "mongoose";

const dislikeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, 
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
     },

    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true, // once created, can't be changed
    },
  },
  {
    timestamps: false, // we don’t need updatedAt
    versionKey: false, // remove __v
  }
);

// Prevent duplicate dislikes by same user
dislikeSchema.index({ user: 1, video: 1 }, { unique: true });

// Utility method to check dislike existence
dislikeSchema.statics.isDisliked = async function (userId, videoId) {
  return await this.exists({ user: userId, video: videoId });
};

const Dislike = mongoose.model("Dislike", dislikeSchema);

export default Dislike;