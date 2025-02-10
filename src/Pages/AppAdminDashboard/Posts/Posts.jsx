import { useContext, useEffect, useState } from "react";
import { AppContext } from "/src/Context/AppContext";
import { useNavigate } from "react-router-dom";
import "./Post.css";

export default function Posts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const { user, token, setUser, setToken } = useContext(AppContext);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
  });

  async function getPosts() {
    const res = await fetch("/api/posts", {
      method: "get",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();

    if (res.ok) {
      setPosts(data.posts);
    }
  }

  const handleEdit = (post) => {
    setSelectedPost(post); // Set the selected post for the modal
    setIsModalOpen(true); // Open the modal
    setFormData({
      title: post.title,
      body: post.body,
    }); // Set the form data with selected post data
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const { title, body } = formData;

    const method = selectedPost ? "PUT" : "POST"; // If editing, use PUT, else use POST
    const endpoint = selectedPost
      ? `/api/posts/${selectedPost.id}`
      : "/api/posts"; // Different endpoint for editing vs creating

    try {
      const res = await fetch(endpoint, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, body }),
      });

      const data = await res.json();

      if (res.ok) {
        if (selectedPost) {
          setPosts(
            posts.map((post) =>
              post.id === selectedPost.id ? data.post : post
            )
          );
        } else {
          setPosts([data.post, ...posts]);
        }

        navigate("/posts"); // Navigate back to posts list
        setIsModalOpen(false); // Close the modal
        setSelectedPost(null); // Clear selected post
        setFormData({ title: "", body: "" }); // Reset form data
      } else {
        setErrors(data.errors); // Set validation errors
      }
    } catch (error) {
      console.error("Error saving post:", error);
      setErrors(["Something went wrong!"]);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
    setSelectedPost(null); // Clear the selected post
    setFormData({ title: "", body: "" }); // Reset form data
  };

  async function handleDelete(postId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setPosts(posts.filter((post) => post.id !== postId));
        alert("Post deleted successfully!");
      } else {
        console.error("Error deleting post:", data);
      }
    } catch (error) {
      console.error("An error occurred while deleting the post:", error);
    }
  }

  useEffect(() => {
    getPosts();
  }, []);

  return (
    <div>
      <h1 className="title">Posts</h1>

      <button
        onClick={() => {
          setIsModalOpen(true);
          setSelectedPost(null);
          setFormData({ title: "", body: "" });
        }}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4"
      >
        Add New Post
      </button>

      <table className="table-auto w-full">
        <thead>
          <tr>
            <th>Title</th>
            <th>Body</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center">
                No posts available.
              </td>
            </tr>
          ) : (
            posts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{post.body}</td>
                <td className="actions">
                  <button
                    onClick={() => handleEdit(post)}
                    className="edit"
                    title="Edit"
                  >
                    📝 Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(post.id);
                    }}
                    className="delete"
                    title="Delete"
                  >
                    ❌ Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="fixed inset-0 bg-overlay flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              {selectedPost ? "Edit Post" : "Add Post"}
            </h2>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block text-sm font-medium">Title</label>
                <input
                  type="text"
                  className="mt-1 block w-full p-2 border rounded"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
                {errors.title && <p className="error">{errors.title[0]}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Body</label>
                <textarea
                  className="mt-1 block w-full p-2 border rounded"
                  value={formData.body}
                  onChange={(e) =>
                    setFormData({ ...formData, body: e.target.value })
                  }
                />
                {errors.body && <p className="error">{errors.body[0]}</p>}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-300 rounded text-black hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
