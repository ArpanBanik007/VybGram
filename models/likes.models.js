import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Either post OR video (never both)
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
      index: true,
    },

    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// 🔒 Unique constraints (VERY IMPORTANT)
likeSchema.index(
  { user: 1, post: 1 },
  { unique: true, sparse: true }
);

likeSchema.index(
  { user: 1, video: 1 },
  { unique: true, sparse: true }
);

// ✅ Utility (optional but good)
likeSchema.statics.isLiked = async function (
  userId,
  { postId = null, videoId = null }
) {
  const filter = { user: userId };
  if (postId) filter.post = postId;
  if (videoId) filter.video = videoId;

  return Boolean(await this.exists(filter));
};

const Like = mongoose.model("Like", likeSchema);
export default Like;
