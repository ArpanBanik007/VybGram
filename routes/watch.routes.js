import { Router } from "express";
import { verifyJWT } from "../middlewire/auth.middlewire.js";
import {
  createwatchHistory,
  getAllWatchHistory,
  deleteHistorybyID,
  deleteAllHistory,
  addWatchLater,
  deleteWatchLaterID,
  getAllWatchLater,
} from "../controller/watch.controller.js";

const router = Router();

/**
 * Watch History Routes
 */

// ✅ Add or update watch history
router.post("/history", verifyJWT, createwatchHistory);

// ✅ Get all watch history (paginated)
router.get("/history", verifyJWT, getAllWatchHistory);

// ✅ Delete a specific watch history entry
router.delete("/history", verifyJWT, deleteHistorybyID);

// ✅ Delete all watch history
router.delete("/history/all", verifyJWT, deleteAllHistory);

/**
 * Watch Later Routes
 */

// ✅ Add video to Watch Later
router.post("/watchlater/:videoId?", verifyJWT, addWatchLater);

// ✅ Remove video from Watch Later
router.delete("/watchlater/:videoId?", verifyJWT, deleteWatchLaterID);

// ✅ Get all Watch Later videos (paginated)
router.get("/watchlater", verifyJWT, getAllWatchLater);

export default router;
