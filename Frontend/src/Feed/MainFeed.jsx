import { useEffect, useState } from "react";
import axios from "axios";
import { FaHeart } from "react-icons/fa";
import { IoMdHeartDislike } from "react-icons/io";
import { FaComment, FaShareNodes } from "react-icons/fa6";
import { PiDotsThreeBold } from "react-icons/pi";

function MainFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedPost = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/v1/posts/feed", {
          withCredentials: true,
        });
        setPosts(res.data?.data?.posts || []);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedPost();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-10 text-lg">
        Loading your posts...
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

  return (
    <>
      {posts.map((post) => (
        <div
          key={post._id}
          className="bg-cyan-200 w-full max-w-md md:max-w-lg lg:max-w-xl 
                    mt-2 mx-auto border rounded-xl shadow-md mb-6"
        >
          {/* Top Section */}
          <div className="flex items-center justify-between p-3">
            {/* Left: Avatar + Name + Date */}
            <div className="flex items-center">
              <img
                src={
                  post?.createdBy?.avatar || "https://via.placeholder.com/40"
                }
                alt="avatar"
                className="h-10 w-10 rounded-full border"
              />

              <div className="ml-3">
                <h3 className="font-semibold">
                  {post?.createdBy?.username || "Unknown"}
                </h3>
                <p className="text-sm text-gray-700">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Right: Follow Button + 3 dots */}
            <div className="flex items-center gap-3 mb-2">
              <button className="text-blue-600 font-semibold hover:underline">
                Follow
              </button>
              <PiDotsThreeBold className="text-2xl text-gray-600 hover:text-black cursor-pointer" />
            </div>
          </div>

          {/* Post Text + Post Media */}
          <div className="px-3 pb-3">
            {post.title && (
              <p className="mb-2 font-semibold text-black">{post.title}</p>
            )}

            {post.posturl && (
              <img
                src={post.posturl}
                alt="post"
                className="w-full max-h-80 rounded-md object-contain"
              />
            )}
          </div>

          {/* Bottom Buttons */}
          <div className="border-t flex justify-around py-2 text-gray-600 text-sm">
            <button className="flex items-center gap-1 hover:text-red-500">
              <FaHeart className="text-base" />
              <span>Like</span>
              <span className="text-xs text-gray-800 font-semibold ml-1">
                {post.likes || 0}
              </span>
            </button>

            <button className="flex items-center gap-1 hover:text-violet-900">
              <IoMdHeartDislike className="text-base" />
              <span>Dislike</span>
              <span className="text-xs text-gray-800 font-semibold ml-1">
                {post.dislikes || 0}
              </span>
            </button>

            <button className="flex items-center gap-1 hover:text-green-500">
              <FaComment className="text-base" />
              <span>Comment</span>
              <span className="text-xs text-gray-800 font-semibold ml-1">
                {post.comments || 0}
              </span>
            </button>

            <button className="flex items-center gap-1 hover:text-purple-600">
              <FaShareNodes className="text-base" />
              <span>Share</span>
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

export default MainFeed;
