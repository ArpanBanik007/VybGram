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
      default: null,
      index: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Prevent duplicate dislikes by same user on same target
dislikeSchema.index({ user: 1, video: 1 }, { unique: true, sparse: true });
dislikeSchema.index({ user: 1, post: 1 }, { unique: true, sparse: true });

// Utility method (same as Like.isLiked but for dislike)
dislikeSchema.statics.isDisliked = async function (
  userId,
  { videoId = null, postId = null }
) {
  const filter = { user: userId };

  if (videoId) filter.video = videoId;
  if (postId) filter.post = postId;

  return await this.exists(filter);
};

const Dislike = mongoose.model("Dislike", dislikeSchema);

export default Dislike;
