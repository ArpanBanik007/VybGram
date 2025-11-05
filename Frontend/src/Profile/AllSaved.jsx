import React from "react";
import myVideo from "../assets/myvideo.mp4";
// ✅ Saved videos list
const savedVideos = [
  {
    id: 1,
    time: "1d ago",
    text: "My new painting 🎨",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: 2,
    time: "2d ago",
    text: "Chilling with friends 😎",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: 3,
    time: "3d ago",
    text: "Nature vibes 🌿",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: 4,
    time: "4d ago",
    text: "Travel diaries ✈️",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: 5,
    time: "4d ago",
    text: "Travel diaries ✈️",
    videoUrl: myVideo,
  },
  {
    id: 6,
    time: "4d ago",
    text: "Travel diaries ✈️",
    videoUrl: myVideo,
  },
];

const AllSaved = () => {
  return (
    <div className="p-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
        {savedVideos.map((video) => (
          <div
            key={video.id}
            className="bg-slate-900 rounded-xl overflow-hidden shadow hover:shadow-lg transition-shadow duration-300"
          >
            {/* 16:9 aspect ratio */}
            <div className="flex justify-center items-center aspect-video w-full ">
              <video
                src={video.videoUrl}
                controls
                className="w-full h-90 object-center"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllSaved;
