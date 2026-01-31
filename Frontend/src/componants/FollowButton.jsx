import React from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { addFollowing, removeFollowing } from "../slices/follow.slice";

const FollowButton = ({ userId, isFollowedByBackend }) => {
  const dispatch = useDispatch();
  const { followings } = useSelector((state) => state.follow);

  // hybrid logic
  const isFollowed =
    followings.length > 0 ? followings.includes(userId) : isFollowedByBackend;

  const handleToggle = async () => {
    try {
      if (isFollowed) {
        dispatch(removeFollowing(userId)); // optimistic UI
        await axios.delete(`/api/v1/users/${userId}/unfollow`, {
          withCredentials: true,
        });
      } else {
        dispatch(addFollowing(userId)); // optimistic UI
        await axios.post(
          `/api/v1/users/${userId}/follow`,
          {},
          { withCredentials: true },
        );
      }
    } catch (err) {
      console.error("Follow toggle failed", err);
      // optionally, revert redux change on error
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`px-3 py-1 rounded text-white ${isFollowed ? "bg-gray-500" : "bg-blue-600"}`}
    >
      {isFollowed ? "Following" : "Follow"}
    </button>
  );
};

export default FollowButton;
