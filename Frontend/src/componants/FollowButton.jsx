import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { addFollowing, removeFollowing } from "../slices/follow.slice";

const FollowButton = ({ userId }) => {
  const dispatch = useDispatch();
  const followings = useSelector((state) => state.follow.followings);
  const isFollowed = followings.includes(userId);

  const handleFollowToggle = async () => {
    try {
      if (isFollowed) {
        const res = await axios.post(
          `http://localhost:8000/api/v1/users/interactions/${userId}/unfollow`,
          {},
          { withCredentials: true },
        );
        dispatch(removeFollowing(userId));
      } else {
        const res = await axios.post(
          `http://localhost:8000/api/v1/users/interactions/${userId}/follow`,
          {},
          { withCredentials: true },
        );
        dispatch(addFollowing(userId));
      }
    } catch (err) {
      console.error("Follow toggle failed", err);
    }
  };

  return (
    <button
      onClick={handleFollowToggle}
      className={`px-3 py-1 rounded ${
        isFollowed ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
      }`}
    >
      {isFollowed ? "Following" : "Follow"}
    </button>
  );
};

export default FollowButton;
