import { useEffect, useState } from "react";
import axios from "axios";
import ReactPlayer from "react-player";
import { FaHeart } from "react-icons/fa";
import { IoMdHeartDislike } from "react-icons/io";
import { FaComment, FaShareNodes } from "react-icons/fa6";
import { PiDotsThreeBold } from "react-icons/pi";
import { RiAccountCircleFill } from "react-icons/ri";
import { FaBookmark } from "react-icons/fa";

function VideoPlayer() {
  const [followedUsers, setFollowedUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // For storing durations of videos
  const [videoDurations, setVideoDurations] = useState({});

  // Fetch videos on mount
  useEffect(() => {
    const fetchFeedVideos = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8000/api/v1/videos/feed",
          { withCredentials: true }
        );
        console.log("API response:", res.data);
        setVideos(res.data?.data?.videos || []);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedVideos();
  }, []);

  // Toggle follow/unfollow
  const toggleFollow = (username) => {
    setFollowedUsers((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  };

  // Check if URL is playable by ReactPlayer
  const isReactPlayable = (url) => {
    if (!url) return false;
    return (
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("cloudinary.com")
    );
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-600">Loading videos...</p>;

  if (videos.length === 0)
    return <p className="text-center mt-10 text-gray-600">No videos found.</p>;

  return (
    <div className="flex flex-col items-center mt-3 h-screen overflow-y-auto">
      {videos.map((video) => (
        <div
          key={video._id}
          className="bg-sky-300 sm:ml-[28%] w-[98%] sm:w-[65%] h-auto rounded-2xl mb-4"
        >
          {/* Header */}
          <div className="flex items-center h-13 mb-0.5 px-4">
            <div className="text-5xl text-gray-700 mr-2">
              {video.createdBy?.avatar ? (
                <img
                  src={video.createdBy.avatar}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <RiAccountCircleFill />
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <p className="font-bold text-gray-900">
                  {video.createdBy?.username || "Unknown"}
                </p>
                <button
                  onClick={() => toggleFollow(video.createdBy?.username)}
                  className={`font-bold ${
                    followedUsers.includes(video.createdBy?.username)
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {followedUsers.includes(video.createdBy?.username)
                    ? "Unfollow"
                    : "Follow"}
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-500">
                {new Date(video.createdAt).toLocaleString() || "Unknown time"}
              </p>
            </div>
          </div>

          {/* Title & Text */}
          <div className="ml-6 mt-1">
            {video.title && (
              <p className="font-bold text-gray-800">{video.title}</p>
            )}
            {video.text && <p className="text-gray-700">{video.text}</p>}
          </div>

          {/* Video Player */}
          <div className="flex justify-center mt-2">
            <div
              className="w-[99%] bg-black rounded-xl overflow-hidden relative"
              style={{ paddingTop: "56.25%" }} // 16:9 aspect ratio
            >
              {isReactPlayable(video.videourl) ? (
                <ReactPlayer
                  url={video.videourl.replace("http://", "https://")}
                  controls
                  width="100%"
                  height="100%"
                  style={{ position: "absolute", top: 0, left: 0 }}
                  onError={(e) => console.log("Video error:", e)}
                  onReady={() => console.log("Video ready:", video.videourl)}
                />
              ) : (
                <video
                  src={video.videourl.replace("http://", "https://")}
                  controls
                  className="w-full h-full object-contain rounded-2xl absolute top-0 left-0"
                />
              )}
            </div>
          </div>

          {/* Duration Display */}
          {videoDurations[video._id] && (
            <p className="ml-6 text-sm text-gray-500 mt-1">
              Duration: {videoDurations[video._id]} sec
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex justify-around py-3 text-gray-600">
            <button className="flex items-center gap-1 hover:text-blue-500">
              <FaHeart /> Like
            </button>
            <button className="flex items-center gap-1 hover:text-red-500">
              <IoMdHeartDislike /> Dislike
            </button>
            <button className="flex items-center gap-1 hover:text-green-500">
              <FaComment /> Comment
            </button>
            <button className="flex items-center gap-1 hover:text-purple-500">
              <FaShareNodes /> Share
            </button>
            <button className="flex items-center gap-1 hover:text-yellow-800">
              <FaBookmark /> Save
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default VideoPlayer;
