import { v2 as cloudinary } from 'cloudinary';

export const deleteFromCloudinary = async (url) => {
  if (!url) return;

  const parts = url.split('/');
  const filenameWithExt = parts[parts.length - 1];
  const publicId = filenameWithExt.split('.')[0]; // Remove .jpg, .mp4 etc

  const folder = parts[parts.length - 2]; // e.g., 'thumbnails' or 'videos'
  const fullPublicId =` ${folder}/${publicId}`;

  try {
    const result = await cloudinary.uploader.destroy(fullPublicId, {
      resource_type: "auto", // auto detects image or video
    });
    return result;
  } catch (error) {
    console.error("❌ Cloudinary deletion failed:", error);
  }
};