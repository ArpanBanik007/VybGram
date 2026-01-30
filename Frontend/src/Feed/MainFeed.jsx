// src/components/MainFeed.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from "../socket";

import { FaHeart } from "react-icons/fa";
import { IoMdHeartDislike } from "react-icons/io";
import { FaComment, FaShareNodes } from "react-icons/fa6";
import { PiDotsThreeBold } from "react-icons/pi";

import { useSelector } from "react-redux";
import FollowButton from "../componants/FollowButton";

function MainFeed() {
  const { mydetails, loading: userLoading } = useSelector(
    (state) => state.mydetails,
  );

  const [posts, setPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);

  /* ================= JOIN SOCKET ROOMS ================= */
  useEffect(() => {
    posts.forEach((post) => {
      socket.emit("join-post", post._id);
    });
  }, [posts]);

  /* ================= SOCKET LISTENER ================= */
  useEffect(() => {
    socket.on("post-reaction-updated", (data) => {
      setPosts((prev) =>
        prev.map((post) =>
          post._id === data.postId
            ? {
                ...post,
                likes: data.likes,
                dislikes: data.dislikes,
                userLiked: data.userLiked,
                userDisliked: data.userDisliked,
              }
            : post,
        ),
      );
    });

    return () => socket.off("post-reaction-updated");
  }, []);

  /* ================= FETCH FEED ================= */
  useEffect(() => {
    const fetchFeedPost = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/v1/posts/feed", {
          withCredentials: true,
        });
        setPosts(res.data?.posts || []);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setFeedLoading(false);
      }
    };
    fetchFeedPost();
  }, []);

  /* ================= LIKE / DISLIKE ================= */
  const handleLike = async (postId) => {
    try {
      const res = await axios.post(
        `http://localhost:8000/api/v1/posts/${postId}/like`,
        {},
        { withCredentials: true },
      );
      const liked = res.data?.liked;
      if (typeof liked !== "boolean") return;

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                userLiked: liked,
                userDisliked: liked ? false : post.userDisliked,
              }
            : post,
        ),
      );
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const handleDislike = async (postId) => {
    try {
      const res = await axios.post(
        `http://localhost:8000/api/v1/posts/${postId}/dislike`,
        {},
        { withCredentials: true },
      );
      const disliked = res.data?.disliked;
      if (typeof disliked !== "boolean") return;

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                userDisliked: disliked,
                userLiked: disliked ? false : post.userLiked,
              }
            : post,
        ),
      );
    } catch (err) {
      console.error("Dislike failed", err);
    }
  };

  /* ================= LOADING / NO POSTS ================= */
  if (feedLoading || userLoading) {
    return (
      <div className="text-center text-gray-400 py-10 text-lg">
        Loading posts...
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10 text-lg">
        No posts available 😕
      </div>
    );
  }

  /* ================= RENDER ================= */
  return (
    <>
      {posts.map((post) => (
        <div
          key={post._id}
          className="bg-cyan-200 w-full max-w-md mx-auto mt-2 mb-6 border rounded-xl shadow-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center">
              <img
                src={
                  post?.createdBy?.avatar || "https://via.placeholder.com/40"
                }
                className="h-10 w-10 rounded-full"
              />
              <div className="ml-3">
                <h3 className="font-semibold">{post?.createdBy?.username}</h3>
                <p className="text-sm text-gray-700">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* FOLLOW BUTTON */}
            {post.createdBy._id !== mydetails?._id && (
              <FollowButton userId={post.createdBy._id} />
            )}

            <PiDotsThreeBold className="text-2xl cursor-pointer" />
          </div>

          {/* Content */}
          <div className="px-3 pb-3">
            {post.title && <p className="mb-2 font-semibold">{post.title}</p>}
            {post.posturl && (
              <img
                src={post.posturl}
                className="w-full max-h-80 rounded-md object-contain"
              />
            )}
          </div>

          {/* Actions */}
          <div className="border-t flex justify-around py-2 text-sm">
            <button
              onClick={() => handleLike(post._id)}
              className={post.userLiked ? "text-red-500" : ""}
            >
              <FaHeart /> {post.likes}
            </button>

            <button
              onClick={() => handleDislike(post._id)}
              className={post.userDisliked ? "text-violet-700" : ""}
            >
              <IoMdHeartDislike /> {post.dislikes}
            </button>

            <button>
              <FaComment /> {post.comments || 0}
            </button>

            <button>
              <FaShareNodes /> Share
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

export default MainFeed;
