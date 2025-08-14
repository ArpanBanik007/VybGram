import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [100, "Title must be less than 100 characters"],
      unique: true, // Optional: ensure title is unique
    },

    posturl: {
      type: String,
      required: [true, "Video URL is required"],
      trim: true,
      match: [
        /^https?:\/\/(?:www\.)?[\w-]+\.[a-z]{2,6}(?:\/[^\s]*)?$/,
        "Please provide a valid video URL (https://...)",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description too long"],
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader info is required"],
    },

    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"],
    },

    tags: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length <= 10,
        message: "Maximum 10 tags allowed",
      },
      default: [],
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    likes: {
      type: Number,
      default: 0,
    },

    dislikes: {
      type: Number,
      default: 0,
    },

    comments: {
      type: Number,
      default: 0,
    },

  },
  {
    timestamps: true,
    versionKey: false,
  }
);


postSchema.index({ title: "text", tags: "text" });

const Post = mongoose.model("Post", postSchema);

export default Post;