import React, { useState } from "react";
import ReactPlayer from "react-player";
import myVideo from "../assets/myvideo.mp4";
import { RiAccountCircleFill } from "react-icons/ri";
import { AiFillLike, AiFillDislike } from "react-icons/ai";
import { FaComment, FaShareNodes } from "react-icons/fa6";
import { FaBookmark } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";
import { IoMdHeartDislike } from "react-icons/io";

function VideoPlayer() {
  const [followedUsers, setFollowedUsers] = useState([]); // ✅ Track follow state

  const videos = [
    {
      id: 1,
      username: "arpanbanik007",
      time: "1d ago",
      text: "My new painting 🎨",
      videoUrl: myVideo,
    },
    {
      id: 2,
      username: "arpanbanik007",
      time: "2d ago",
      text: "Chilling with friends 😎",
      videoUrl: myVideo,
    },
    {
      id: 3,
      username: "arpanbanik007",
      time: "3d ago",
      text: "Nature vibes 🌿",
      videoUrl: myVideo,
    },
    {
      id: 4,
      username: "arpanbanik007",
      time: "4d ago",
      text: "New artwork 🖌️",
      videoUrl: myVideo,
    },
    {
      id: 5,
      username: "arpanbanik007",
      time: "5d ago",
      text: "Travel diaries ✈️",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // ✅ YouTube short link
    },
  ];

  // ✅ Toggle follow/unfollow
  const toggleFollow = (username) => {
    setFollowedUsers(
      (prev) =>
        prev.includes(username)
          ? prev.filter((u) => u !== username) // unfollow
          : [...prev, username] // follow
    );
  };

  // ✅ Helper to detect if ReactPlayer should be used
  const isReactPlayable = (url) =>
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("cloudinary.com");

  return (
    <div className="flex flex-col items-center mt-3 h-screen overflow-y-auto">
      {videos.map((video) => (
        <div
          key={video.id}
          className="bg-sky-300 sm:ml-[28%] w-[98%] h-auto sm:w-[65%] rounded-2xl mb-4"
        >
          {/* Header */}
          <div className="flex items-center h-13 mb-0.5 px-4">
            {/* Profile Icon */}
            <div className="text-5xl text-gray-700 mr-2">
              <RiAccountCircleFill />
            </div>

            {/* Username + Time + Follow */}
            <div className="flex flex-col">
              <div className="flex items-center mr-2 gap-3">
                <p className="font-bold text-gray-900">{video.username}</p>

                {/* ✅ Follow/Unfollow inline with username */}
                <button
                  onClick={() => toggleFollow(video.username)}
                  className={`font-bold ${
                    followedUsers.includes(video.username)
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {followedUsers.includes(video.username)
                    ? "Unfollow"
                    : "Follow"}
                </button>
              </div>

              <p className="text-sm font-semibold text-gray-500">
                {video.time}
              </p>
            </div>
          </div>

          {/* Caption */}
          <span className="text-sm font-bold text-gray-900 ml-6">
            {video.text}
          </span>

          {/* Video Container (Fixed Ratio 16:9) */}
          <div className="flex justify-center mt-2">
            <div className="w-[99%] bg-black rounded-xl overflow-hidden">
              <div className="aspect-video">
                {isReactPlayable(video.videoUrl) ? (
                  <ReactPlayer
                    url={video.videoUrl}
                    controls
                    width="100%"
                    height="100%"
                  />
                ) : (
                  <video
                    src={video.videoUrl}
                    controls
                    className="w-full h-full object-contain rounded-2xl"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-around py-3 text-gray-600">
            <button className="flex items-center gap-1 hover:text-blue-500">
              <FaHeart /> Like
            </button>
            <button className="flex items-center gap-1 hover:text-red-500">
              <IoMdHeartDislike /> DisLike
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
