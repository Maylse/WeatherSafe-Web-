import { useContext, useEffect, useState } from "react";
import { AppContext } from "/src/Context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Posts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const { user, token } = useContext(AppContext);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({ title: "", body: "" });

  async function getPosts() {
    const res = await fetch("/api/posts", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setPosts(data.posts);
  }

  const handleEdit = (post) => {
    setSelectedPost(post); // Ensure post is stored
    setFormData({ title: post.title, body: post.body }); // Populate form fields
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.body.trim()) {
      setErrors(["Title and body cannot be empty."]);
      return;
    }

    // Ensure selectedPost is correctly checked
    const method = selectedPost && selectedPost.id ? "PUT" : "POST";
    const endpoint = selectedPost
      ? `/api/posts/${selectedPost.id}`
      : "/api/posts";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setPosts((prevPosts) =>
          selectedPost
            ? prevPosts.map((post) =>
                post.id === selectedPost.id ? data.post : post
              )
            : [data.post, ...prevPosts]
        );

        setIsModalOpen(false);
        setSelectedPost(null); // Clear selected post after update
        setFormData({ title: "", body: "" }); // Reset form
      } else {
        setErrors(data.errors || ["Something went wrong!"]);
      }
    } catch (error) {
      setErrors(["Something went wrong!"]);
    }
  };

  const handleDelete = (post) => {
    setPostToDelete(post);
    setIsDeleteModalOpen(true);
  };
  async function confirmDelete() {
    if (!postToDelete) return;

    try {
      const res = await fetch(`/api/posts/${postToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json(); // Parse the JSON response

      if (res.ok) {
        // ✅ Remove the barangay from the list
        setPosts(posts.filter((post) => post.id !== postToDelete.id));
        setIsDeleteModalOpen(false);
        console.log(data.message); // Debugging: Ensure successful message logs
      } else {
        console.error("Error deleting post:", data.message || "Unknown error");
      }
    } catch (error) {
      console.error("An error occurred while deleting the post:", error);
    }
  }

  useEffect(() => {
    getPosts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Posts</h1>

      <button
        onClick={() => {
          setIsModalOpen(true);
          setSelectedPost(null); // Ensure no selected admin
          setFormData({
            // Clear the form for new entries
            title: "",
            body: "",
          });
        }}
        className="btn btn-primary mb-4"
      >
        Add New Post
      </button>

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
                <td colSpan="4" className="px-4 py-2 text-center">
                  No posts available.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="border-b hover:bg-slate-100">
                  <td className="px-4 py-2">{post.title}</td>
                  <td className="px-4 py-2">{post.body}</td>
                  <td>
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
                />
                {errors.title && (
                  <p className="text-error">{errors.title[0]}</p>
                )}
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
                ></textarea>
                {errors.body && <p className="text-error">{errors.body[0]}</p>}
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
      {/* Delete Confirmation Modal */}
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
