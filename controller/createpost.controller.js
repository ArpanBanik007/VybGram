import Post from "../models/createpost.models.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs"






const createpost= asyncHandler(async (req,res) => {
    const { title, description, tags = [],  isPublished } = req.body;
    const userId=req.user?._id;

      if (!title?.trim()) throw new ApiError(400, "Title is required");
      if (!description?.trim()) throw new ApiError(400, "Description is required");
      if (description.length > 1000) throw new ApiError(400, "Description must be under 1000 characters");

      if (!Array.isArray(tags) || tags.some(tag => typeof tag !== "string")) {
          throw new ApiError(400, "Tags must be an array of strings");
        }
      
     const publishStatus = typeof isPublished === "boolean" ? isPublished : false;


      const postFile= req.files?.posturl?.[0]  ;
      
       if (!postFile?.path) throw new ApiError(400, "Post file is required");

       const postPath=postFile?.path;

       const uploadPost= await uploadOnCloudinary(postPath, "posts")

       fs.unlink(postPath,()=>{})

       if (!uploadPost?.url) throw new ApiError(500, "Post upload failed");

       const newPost= await Post.create({
        title:title.trim(),
        description:description.trim(),
        tags,
        posturl:uploadPost.url,
        isPublished:publishStatus,
        uploadedBy:userId,
        createdBy:userId
       })
       
  return res
    .status(201)
    .json(new ApiResponse(201, newPost, "Post uploaded successfully")); 
})




export{
    createpost,

}