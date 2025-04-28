import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";
import axios from "axios";

const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

export default function CommunityUsers() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [communityUserToDelete, setCommunityUserToDelete] = useState(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [communityUserToRestore, setCommunityUserToRestore] = useState(null);
  const [selectedCommunityUser, setSelectedCommunityUser] = useState(null);
  const { user, token } = useContext(AppContext); // Token is handled by api.js
  const [communityUsers, setCommunityUsers] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirmation: "",
  });

  // Fetch community users using Axios
  async function getCommunityUsers() {
    try {
      setLoading(true);
      const response = await axios.get(`${serverUrl}/api/community-user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCommunityUsers(response.data.community_users || []);
      setErrors([]);
    } catch (error) {
      console.error("Error fetching community users:", error);
      setErrors(["Failed to fetch Community Users"]);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (communityUser) => {
    setSelectedCommunityUser(communityUser);
    setIsModalOpen(true);
    setFormData({
      email: communityUser?.user?.email || "",
      password: "",
      password_confirmation: "",
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrors([]);

    try {
      const { email, password, password_confirmation } = formData;

      // Validate password confirmation
      if (password && password !== password_confirmation) {
        throw new Error("Passwords do not match");
      }

      const response = await axios.put(
        `${serverUrl}/api/community-user/${selectedCommunityUser.id}`,
        {
          email,
          password,
          password_confirmation,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // On success
      await getCommunityUsers();
      setIsModalOpen(false);
      setSelectedCommunityUser(null);
      setFormData({
        email: "",
        password: "",
        password_confirmation: "",
      });
    } catch (error) {
      console.error("Error saving community user:", error);
      if (error.response?.data?.errors) {
        setErrors(Object.values(error.response.data.errors).flat());
      } else {
        setErrors([error.message || "Something went wrong!"]);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCommunityUser(null);
    setFormData({
      email: "",
      password: "",
      password_confirmation: "",
    });
  };

  const handleDelete = (communityUser) => {
    setCommunityUserToDelete(communityUser);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!communityUserToDelete) return;

    try {
      await axios.delete(
        `${serverUrl}/api/community-user/${communityUserToDelete.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await getCommunityUsers();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting community user:", error);
    }
  };

  const confirmRestore = async () => {
    if (!communityUserToRestore) return;

    try {
      await axios.patch(
        `${serverUrl}/api/community-user/${communityUserToRestore.id}/restore`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await getCommunityUsers();
      setIsRestoreModalOpen(false);
    } catch (error) {
      console.error("Error restoring community user:", error);
    }
  };

  const handleRestore = (communityUser) => {
    setCommunityUserToRestore(communityUser);
    setIsRestoreModalOpen(true);
  };

  useEffect(() => {
    getCommunityUsers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-black">Community Users</h1>
      {errors.length > 0 && (
        <div className="alert alert-error mb-4">
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <table className="table-auto w-full text-sm border-collapse mt-4 border border-gray-300 text-black">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-4 py-2 text-left border">Community User Name</th>
            <th className="px-4 py-2 text-left border">Email</th>
            <th className="px-4 py-2 text-left border">Barangay</th>
            <th className="px-4 py-2 text-left border">Status</th>
            <th className="px-4 py-2 text-left border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="5" className="px-4 py-2 text-center border">
                Loading...
              </td>
            </tr>
          ) : communityUsers.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-4 py-2 text-center border">
                No Community Users available.
              </td>
            </tr>
          ) : (
            communityUsers.map((communityUser) => (
              <tr
                key={communityUser.id}
                className="border-b hover:bg-slate-100"
              >
                <td className="px-4 py-2 border">
                  {communityUser.user?.name || "N/A"}
                </td>
                <td className="px-4 py-2 border">
                  {communityUser.user?.email || "No Email"}
                </td>
                <td className="px-4 py-2 border">
                  {communityUser.barangay.brgy_name || "N/A"}
                </td>
                <td
                  className={`px-4 py-2 border font-semibold ${
                    communityUser.user?.status === "ACTIVE"
                      ? "text-green-600"
                      : communityUser.user?.status === "INACTIVE"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {communityUser.user?.status || "N/A"}
                </td>
                <td className="px-4 py-2 border flex space-x-2">
                  <button
                    onClick={() => handleEdit(communityUser)}
                    className="btn btn-primary btn-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(communityUser)}
                    className="btn btn-error btn-sm"
                  >
                    ❌ Delete
                  </button>
                  <button
                    onClick={() => handleRestore(communityUser)}
                    className="btn btn-success btn-sm"
                  >
                    🔃 Restore
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Edit Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h2 className="text-xl font-semibold mb-4">Edit Community User</h2>
            <form onSubmit={handleSave}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
                {errors.email && (
                  <p className="text-error">{errors.email[0]}</p>
                )}
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Leave blank to keep current password"
                />
                {errors.password && (
                  <p className="text-error">{errors.password[0]}</p>
                )}
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Confirm Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={formData.password_confirmation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password_confirmation: e.target.value,
                    })
                  }
                  placeholder="Leave blank to keep current password"
                />
                {errors.password_confirmation && (
                  <p className="text-error">
                    {errors.password_confirmation[0]}
                  </p>
                )}
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
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
              Are you sure you want to delete{" "}
              {communityUserToDelete?.user?.name}?
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

      {/* Restore Confirmation Modal */}
      {isRestoreModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Restore</h3>
            <p className="py-4">
              Are you sure you want to restore{" "}
              {communityUserToRestore?.user?.name}?
            </p>
            <div className="modal-action">
              <button className="btn btn-success" onClick={confirmRestore}>
                Yes, Restore
              </button>
              <button
                className="btn"
                onClick={() => setIsRestoreModalOpen(false)}
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
