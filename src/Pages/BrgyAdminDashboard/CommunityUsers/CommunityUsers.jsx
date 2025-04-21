import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export default function CommunityUsers() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [communityUserToDelete, setCommunityUserToDelete] = useState(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [communityUserToRestore, setCommunityUserToRestore] = useState(null);
  const [selectedCommunityUser, setSelectedCommunityUser] = useState(null);
  const { user, token, setUser, setToken } = useContext(AppContext);
  const [communityUsers, setCommunityUsers] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirmation: "",
  });

  async function getCommunityUsers() {
    try {
      const res = await fetch(`${apiUrl}/api/community-user`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      console.log(data);
      if (res.ok) {
        setCommunityUsers(data.community_users || []); // Default to empty array if data is undefined
      } else {
        setErrors([data.message || "Failed to load Community Users"]);
      }
    } catch (error) {
      setErrors(["Failed to fetch Community Users"]);
    } finally {
      setLoading(false); // Set loading to false after data is fetched
    }
  }

  const handleEdit = (communityUser) => {
    setSelectedCommunityUser(communityUser); // Set the selected admin for the modal
    setIsModalOpen(true); // Open the modal
    setFormData({
      email: communityUser?.user?.email || "", // Safe access for email
      password: "",
      password_confirmation: "",
    });
  };

  const handleSave = async (e) => {
    e.preventDefault(); // Prevent the form from submitting normally
    const { email, password, password_confirmation } = formData;

    const method = "PUT"; // Use PUT if editing, POST if creating
    const endpoint = `${apiUrl}/api/community-user/${selectedCommunityUser.id}`;

    try {
      const res = await fetch(endpoint, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          password_confirmation,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        // Refetch the list of Barangay Admins to ensure the table is up-to-date
        await getCommunityUsers();
        setIsModalOpen(false);
        setSelectedCommunityUser(null);
        setFormData({
          email: "",
          password: "",
          password_confirmation: "",
        });
      } else {
        setErrors(data.errors || ["Something went wrong!"]);
      }
    } catch (error) {
      console.error("Error saving Barangay User:", error);
      setErrors(["Something went wrong!"]);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
    setSelectedCommunityUser(null); // Clear the selected post
    setFormData({
      email: "",
      password: "",
      password_confirmation: "",
    }); // Reset form data
  };

  const handleDelete = (communityUser) => {
    setCommunityUserToDelete(communityUser);
    setIsDeleteModalOpen(true);
  };

  async function confirmDelete() {
    if (!communityUserToDelete) return;

    try {
      const res = await fetch(
        `${apiUrl}/api/community-user/${communityUserToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json(); // Parse the JSON response

      if (res.ok) {
        // Refresh the list after deletion
        await getCommunityUsers();
        setIsDeleteModalOpen(false);
      } else {
        console.error(
          "Error deleting community user:",
          data.message || "Unknown error"
        );
      }
    } catch (error) {
      console.error(
        "An error occurred while deleting a community user:",
        error
      );
    }
  }

  async function confirmRestore() {
    if (!communityUserToRestore) return;

    try {
      const res = await fetch(
        `${apiUrl}/api/community-user/${communityUserToRestore.id}/restore`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json(); // Parse the JSON response

      if (res.ok) {
        // Refresh the list after deletion
        await getCommunityUsers();
        setIsRestoreModalOpen(false);
      } else {
        console.error(
          "Error restoring a community user:",
          data.message || "Unknown error"
        );
      }
    } catch (error) {
      console.error(
        "An error occurred while restoring a community user:",
        error
      );
    }
  }
  const handleRestore = async (communityUser) => {
    setCommunityUserToRestore(communityUser);
    setIsRestoreModalOpen(true);
  };

  // Fetch Barangay Users when component mounts
  useEffect(() => {
    getCommunityUsers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Community Users</h1>
      {errors.length > 0 && (
        <div className="text-red-500 mb-4">
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <table className="table-auto w-full text-sm border-collapse mt-4 border border-gray-300">
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
            <h2 className="text-xl font-semibold mb-4"></h2>
            <form onSubmit={handleSave}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  className="input input-bordered"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              {errors.email && <p className="text-error">{errors.email[0]}</p>}

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  className="input input-bordered"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              {errors.password && (
                <p className="text-error">{errors.password[0]}</p>
              )}

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Confirm Password</span>
                </label>
                <input
                  className="input input-bordered"
                  type="password"
                  value={formData.password_confirmation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password_confirmation: e.target.value,
                    })
                  }
                />
              </div>
              {errors.password_confirmation && (
                <p className="text-error">{errors.password_confirmation[0]}</p>
              )}
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
              Are you sure you want to delete {communityUserToDelete?.user.name}
              ?
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
              {communityUserToRestore?.user.name}?
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
