import { useEffect, useState } from "react";
import axios from "axios";
import { FaHeart } from "react-icons/fa";
import { IoMdHeartDislike } from "react-icons/io";
import { FaComment, FaShareNodes } from "react-icons/fa6";
import { RiAccountCircleFill } from "react-icons/ri";
import { FaBookmark } from "react-icons/fa";

function VideoPlayer() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followedUsers, setFollowedUsers] = useState({});

  // ✅ Fetch videos
  useEffect(() => {
    const fetchFeedVideos = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8000/api/v1/videos/feed",
          { withCredentials: true }
        );

        console.log("Videos:", res.data?.data?.videos);
        setVideos(res.data?.data?.videos || []);
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedVideos();
  }, []);

  const toggleFollow = (username) => {
    setFollowedUsers((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  if (loading) {
    return <p className="text-center mt-10">Loading videos...</p>;
  }

  if (videos.length === 0) {
    return <p className="text-center mt-10">No videos found</p>;
  }

  return (
    <div className="flex flex-col items-center mt-4 space-y-6">
      {videos.map((video) => {
        const videoSrc = video.videourl
          ?.replace("/upload/", "/upload/f_mp4,vc_h264/")
          ?.replace("http://", "https://");

        return (
          <div
            key={video._id}
            className="w-[95%] sm:w-[65%] bg-sky-300 rounded-2xl p-4"
          >
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-2">
              {video.createdBy?.avatar ? (
                <img
                  src={video.createdBy.avatar}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <RiAccountCircleFill className="text-4xl text-gray-600" />
              )}

              <div className="flex-1">
                <p className="font-bold">{video.createdBy?.username}</p>
                <p className="text-xs text-gray-600">
                  {new Date(video.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => toggleFollow(video.createdBy?.username)}
                className={`font-bold ${
                  followedUsers[video.createdBy?.username]
                    ? "text-red-600"
                    : "text-blue-600"
                }`}
              >
                {followedUsers[video.createdBy?.username]
                  ? "Unfollow"
                  : "Follow"}
              </button>
            </div>

            {/* TITLE */}
            {video.title && <p className="font-semibold mb-2">{video.title}</p>}

            {/* VIDEO */}
            <div className="bg-black rounded-xl overflow-hidden">
              <video
                src={videoSrc}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-[500px] object-contain"
                onLoadedMetadata={(e) =>
                  console.log("Duration:", e.target.duration)
                }
                onError={(e) => console.error("Video failed:", e.target.error)}
              />
            </div>

            {/* ACTIONS */}
            <div className="flex justify-around mt-4 text-gray-700">
              <button className="flex items-center gap-1">
                <FaHeart /> Like
              </button>
              <button className="flex items-center gap-1">
                <IoMdHeartDislike /> Dislike
              </button>
              <button className="flex items-center gap-1">
                <FaComment /> Comment
              </button>
              <button className="flex items-center gap-1">
                <FaShareNodes /> Share
              </button>
              <button className="flex items-center gap-1">
                <FaBookmark /> Save
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default VideoPlayer;
