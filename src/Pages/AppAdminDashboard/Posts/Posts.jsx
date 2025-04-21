import { useContext, useEffect, useState } from "react";
import { AppContext } from "/src/Context/AppContext";
import { useNavigate } from "react-router-dom";
import api from "../../../../api";

export default function Posts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const { user } = useContext(AppContext); // Token is handled by api.js
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({ title: "", body: "" });

  // Fetch posts using Axios
  async function getPosts() {
    try {
      const response = await api.get("/api/posts");
      setPosts(response.data.posts || []);
      setErrors([]);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setErrors(["Failed to fetch posts"]);
    }
  }

  const handleEdit = (post) => {
    setSelectedPost(post);
    setFormData({
      title: post.title || "",
      body: post.body || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrors([]);

    if (!formData.title.trim() || !formData.body.trim()) {
      setErrors(["Title and body cannot be empty."]);
      return;
    }

    try {
      const method = selectedPost ? "put" : "post";
      const endpoint = selectedPost
        ? `/api/posts/${selectedPost.id}`
        : "/api/posts";

      const response = await api[method](endpoint, formData);

      // Update local state
      setPosts((prevPosts) =>
        selectedPost
          ? prevPosts.map((post) =>
              post.id === selectedPost.id ? response.data.post : post
            )
          : [response.data.post, ...prevPosts]
      );

      setIsModalOpen(false);
      setSelectedPost(null);
      setFormData({ title: "", body: "" });
    } catch (error) {
      console.error("Error saving post:", error);
      if (error.response?.data?.errors) {
        setErrors(Object.values(error.response.data.errors).flat());
      } else {
        setErrors(["Something went wrong!"]);
      }
    }
  };

  const handleDelete = (post) => {
    setPostToDelete(post);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    try {
      await api.delete(`/api/posts/${postToDelete.id}`);

      // Update local state
      setPosts(posts.filter((post) => post.id !== postToDelete.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  useEffect(() => {
    getPosts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Posts</h1>

      <button
        onClick={() => {
          setIsModalOpen(true);
          setSelectedPost(null);
          setFormData({ title: "", body: "" });
        }}
        className="btn btn-primary mb-4"
      >
        Add New Post
      </button>

      {errors.length > 0 && (
        <div className="alert alert-error mb-4">
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table-auto w-full text-sm border-collapse mt-4">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Body</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-4 py-2 text-center">
                  No posts available.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="border-b hover:bg-slate-100">
                  <td className="px-4 py-2">{post.title}</td>
                  <td className="px-4 py-2">{post.body}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleEdit(post)}
                      className="btn btn-primary btn-sm mr-2"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post)}
                      className="btn btn-error btn-sm"
                    >
                      ❌ Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h2 className="text-xl font-semibold mb-4">
              {selectedPost ? "Edit Post" : "Add Post"}
            </h2>
            <form onSubmit={handleSave}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Title</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Body</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={formData.body}
                  onChange={(e) =>
                    setFormData({ ...formData, body: e.target.value })
                  }
                  required
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Delete</h3>
            <p className="py-4">
              Are you sure you want to delete {postToDelete?.title}?
            </p>
            <div className="modal-action">
              <button className="btn btn-error" onClick={confirmDelete}>
                Yes, Delete
              </button>
              <button
                className="btn"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
