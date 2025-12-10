import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FaHeart, FaComment, FaShareNodes } from "react-icons/fa6";
import { IoMdHeartDislike } from "react-icons/io";
import { PiDotsThreeBold } from "react-icons/pi";

const AllSaved = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8000/api/v1/watch/watchlater",
          { withCredentials: true }
        );
        setSavedItems(res.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch saved items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, []);

  const toggleSaveMenu = (savedItems) => {
    setSavedItems((prevId) => (prevId === savedItems ? null : savedItems));
  };

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-10 text-lg">
        Loading your saved items...
      </div>
    );
  }

  if (savedItems.length === 0) {
    return (
      <div className="text-center text-gray-200 py-10 text-lg">
        You haven’t saved anything yet 😕
      </div>
    );
  }

  return (
    <div className="p-2 flex flex-col items-center">
      {savedItems.map((item) => {
        const post = item.postId;
        const video = item.videoId;
        const createdBy = post?.createdBy || video?.createdBy;

        return (
          <div
            key={item._id}
            className="relative bg-white dark:bg-slate-800 w-full max-w-xl mx-auto mt-4 border rounded-xl shadow-md mb-6 hover:shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center">
                <img
                  src={createdBy?.avatar || "https://via.placeholder.com/40"}
                  alt="avatar"
                  className="h-10 w-10 rounded-full border"
                />
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {createdBy?.username || "Unknown"}
                  </h3>
                </div>
              </div>

              <PiDotsThreeBold className="text-2xl text-gray-400 cursor-pointer hover:text-gray-200" />
            </div>

            {/* Content */}
            <div className="px-3 pb-3">
              {post?.title && (
                <p className="mb-2 font-semibold text-gray-800 dark:text-gray-100">
                  {post.title}
                </p>
              )}

              {/* Image post */}
              {post?.posturl && (
                <img
                  src={post.posturl}
                  alt="Saved Post"
                  className="w-full max-h-80 rounded-md object-contain"
                />
              )}

              {/* Video */}
              {video?.videoUrl && (
                <video
                  controls
                  className="w-full rounded-md max-h-80 object-contain mt-2"
                >
                  <source src={video.videoUrl} type="video/mp4" />
                </video>
              )}
            </div>

            {/* Footer */}
            <div className="border-t flex justify-around py-2 text-gray-400 text-sm">
              <button className="flex items-center gap-1 hover:text-red-500">
                <FaHeart />
                Like
              </button>
              <button className="flex items-center gap-1 hover:text-violet-900">
                <IoMdHeartDislike />
                Dislike
              </button>
              <button className="flex items-center gap-1 hover:text-green-500">
                <FaComment />
                Comment
              </button>
              <button className="flex items-center gap-1 hover:text-purple-600">
                <FaShareNodes />
                Share
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AllSaved;
