import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import { selectUser } from "../store/slices/authSlice";
import { PostType } from "../Types/Post.types";

const usePostActions = () => {
  const currentUser = useSelector(selectUser);

  const createPost = async (postData: FormData) => {
    try {
      await axios.post("http://localhost:5000/api/v1/posts", postData);
    } catch (error) {
      toast.info(`Something went wrong!`);
    }
  };

  const editPost = async (
    postId: string,
    formData: FormData
  ): Promise<PostType | undefined> => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/v1/posts/${postId}`,
        formData
      );
      return response.data;
    } catch (error) {
      toast.info(`Something went wrong!`);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/v1/posts/${postId}`);
    } catch (error) {
      toast.info(`Something went wrong!`);
    }
  };

  const toggleBookmarkPost = async (postId: string) => {
    try {
      await axios.post(
        `http://localhost:5000/api/v1/users/${
          currentUser!.username
        }/toggle-bookmark/${postId}`
      );
    } catch (error) {
      toast.info(`Something went wrong!`);
    }
  };

  const toggleLikePost = async (postId: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/v1/posts/${postId}/like`, {
        username: currentUser!.username,
      });
    } catch (error) {
      toast.info(`Something went wrong!`);
    }
  };

  return {
    createPost,
    editPost,
    deletePost,
    toggleBookmarkPost,
    toggleLikePost,
  };
};

export default usePostActions;
