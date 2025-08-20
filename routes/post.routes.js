import { Router } from "express";
import { verifyJWT } from "../middlewire/auth.middlewire.js";
import { upload } from "../middlewire/multer.middlewire.js";

import {
  createpost,
  updatePost,
  deletePost,
  getPostsFeed,
  getSinglePost,
  togglePostLike,
  togglePostDislike,
  addPostViews,
} from "../controller/post.controller.js";

const router = Router();

/**
 * Post Routes
 */

// ✅ Create a new post (image optional)
router.post("/", verifyJWT, upload.single("posturl"), createpost);

// ✅ Get posts feed (search, pagination)
router.get("/", getPostsFeed);

// ✅ Get single post by ID
router.get("/:postId", getSinglePost);

// ✅ Update post (only owner, image optional)
router.patch("/:postId", verifyJWT, upload.single("posturl"), updatePost);

// ✅ Delete post (only owner)
router.delete("/:postId", verifyJWT, deletePost);

// ✅ Like toggle on a post
router.post("/:postId/like", verifyJWT, togglePostLike);

// ✅ Dislike toggle on a post
router.post("/:postId/dislike", verifyJWT, togglePostDislike);

// ✅ Add view to post
router.post("/:postId/view", addPostViews);

export default router;
