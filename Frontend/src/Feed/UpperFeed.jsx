import { MdLiveTv } from "react-icons/md";
import { IoMdPhotos } from "react-icons/io";
import { BiVideoPlus } from "react-icons/bi";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { fetchMydetils } from "../slices/mydetails.slice"; // Redux thunk

function UpperFeedpage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux user details
  const { mydetails } = useSelector((state) => state.mydetails);

  // Local States
  const [showPostBox, setShowPostBox] = useState(false);
  const [postType, setPostType] = useState("text");
  const [imagePreview, setImagePreview] = useState(null);
  const [postDescription, setPostDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch user details once
  useEffect(() => {
    if (!mydetails || Object.keys(mydetails).length === 0) {
      dispatch(fetchMydetils());
    }
  }, [dispatch, mydetails]);

  // 🧩 Handle Image Selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // 🧩 Handle Post Create
  const handleCreatePost = async () => {
    if (!postDescription && !selectedFile) {
      alert("Please write something or select a photo!");
      return;
    }

    const formData = new FormData();
    formData.append("title", postDescription);
    formData.append("description", postDescription);
    formData.append("isPublished", true);

    // 👇 Field name must match backend "postFile"
    if (selectedFile) {
      formData.append("postFile", selectedFile);
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:8000/api/v1/posts/",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("✅ Post Created:", res.data);
      alert("Post uploaded successfully!");

      // reset
      setShowPostBox(false);
      setImagePreview(null);
      setPostDescription("");
      setSelectedFile(null);
    } catch (error) {
      console.error("❌ Error:", error.response?.data || error.message);
      alert("Upload failed!");
    } finally {
      setLoading(false);
    }
  };

  // video Section
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedVideo(file);

      const previewURL = URL.createObjectURL(file);
      setPreviewVideo(previewURL);
    }
  };

  return (
    <div className="flex justify-center w-full mt-2">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl bg-cyan-400 rounded-xl p-3 shadow-md mx-auto">
        <div className="flex justify-start w-full">
          <img
            src={
              mydetails?.avatar ||
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCn-TbanZWBS1uNFOOkr8QavCC0A9p-4SaFw&s"
            }
            alt="profile"
            onClick={() => navigate("/profile")}
            className="h-12 w-12 rounded-full border mr-2 cursor-pointer"
          />
          <div
            onClick={() => {
              setPostType("text");
              setShowPostBox(true);
            }}
            className="flex items-center gap-3 bg-cyan-200 h-10 w-[90%] hover:bg-amber-300 cursor-pointer rounded-xl px-4 py-2"
          >
            <span className="text-gray-600">What's on your mind...</span>
          </div>
        </div>

        <div className="flex justify-evenly text-3xl text-gray-800 mt-2">
          <MdLiveTv className="cursor-pointer hover:text-red-800" />
          <IoMdPhotos
            onClick={() => {
              setPostType("photo");
              setShowPostBox(true);
            }}
            className="cursor-pointer hover:text-green-800"
          />
          <BiVideoPlus className="cursor-pointer hover:text-blue-800" />
        </div>
      </div>

      {/* 📦 Post Modal */}
      {showPostBox && (
        <>
          {/* Background Blur */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => {
              setShowPostBox(false);
              setImagePreview(null);
            }}
          ></div>

          {/* Post Box */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 rounded-xl shadow-xl p-6 w-[90%] max-w-md z-50">
            <h2 className="text-xl text-gray-300 font-semibold mb-4">
              {postType === "photo" ? "Create Photo Post" : "Create Text Post"}
            </h2>

            {/* Text Post */}
            {postType === "text" && (
              <textarea
                className="w-full border text-white rounded-md p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                rows="4"
                placeholder="What's on your mind?"
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
              />
            )}

            {/* Photo Post */}
            {postType === "photo" && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="mb-3 text-white font-bold italic rounded-md"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="rounded-md mb-4 max-h-60 object-cover"
                  />
                )}
                <textarea
                  className="w-full border text-white rounded-md p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  rows="2"
                  placeholder="Say something about this photo..."
                  value={postDescription}
                  onChange={(e) => setPostDescription(e.target.value)}
                />
              </>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPostBox(false);
                  setImagePreview(null);
                  setSelectedFile(null);
                  setPostDescription("");
                }}
                className="px-4 py-1 bg-gray-600 hover:bg-gray-400 text-white rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={loading}
                className={`px-4 py-1 ${
                  loading ? "bg-gray-400" : "bg-cyan-500 hover:bg-cyan-600"
                } text-white rounded-md`}
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default UpperFeedpage;
