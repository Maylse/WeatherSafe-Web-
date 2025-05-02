import { useContext, useEffect, useState } from "react";
import { AppContext } from "/src/Context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

export default function Posts() {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const { user, token } = useContext(AppContext);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({ title: "", body: "" });

  // Fetch posts using Axios
  async function getPosts() {
    try {
      const response = await axios.get(`${serverUrl}/api/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
    setIsSaving(true); // Show loading modal

    if (!formData.title.trim() || !formData.body.trim()) {
      setErrors(["Title and body cannot be empty."]);
      setIsSaving(false);
      return;
    }

    try {
      const method = selectedPost ? "put" : "post";
      const endpoint = selectedPost
        ? `${serverUrl}/api/posts/${selectedPost.id}`
        : `${serverUrl}/api/posts`;

      const response = await axios[method](endpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
    } finally {
      setIsSaving(false); // Hide loading modal
    }
  };

  const handleDelete = (post) => {
    setPostToDelete(post);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true); // Show loading modal

    try {
      await axios.delete(`${serverUrl}/api/posts/${postToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state
      setPosts(posts.filter((post) => post.id !== postToDelete.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting post:", error);
      setErrors(["Failed to delete post"]);
    } finally {
      setIsDeleting(false); // Hide loading modal
    }
  };

  useEffect(() => {
    getPosts();
  }, []);

  function LoadingModal({ isOpen, message }) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
        <div className="modal-box p-6 rounded-lg shadow-lg max-w-sm w-full z-[101]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white">
              {message || "Processing, please wait..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Loading Modals */}
      <LoadingModal
        isOpen={isSaving}
        message={selectedPost ? "Updating Post..." : "Creating Post..."}
      />
      <LoadingModal isOpen={isDeleting} message="Deleting Post..." />
      <h1 className="text-2xl font-bold mb-4 text-black">Posts</h1>

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
        <table className="table-auto w-full text-sm border-collapse mt-4 text-black">
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(post)}
                        className="btn btn-primary btn-sm"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="btn btn-error btn-sm"
                      >
                        ❌ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div
          className={`modal modal-open z-50 ${
            isSaving ? "pointer-events-none" : ""
          }`}
        >
          <div className="modal-box relative">
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
        <div
          className={`modal modal-open z-50 ${
            isSaving ? "pointer-events-none" : ""
          }`}
        >
          <div className="modal-box relative">
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
