import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";

export default function BrgyUsers() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [brgyUserToDelete, setBrgyUserToDelete] = useState(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [brgyUserToRestore, setBrgyUserToRestore] = useState(null);
  const [selectedBrgyUser, setSelectedBrgyUser] = useState(null);
  const { user, token, setUser, setToken } = useContext(AppContext);
  const [brgyUsers, setBrgyUsers] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    brgy_user_name: "",
    barangay: "",
    password: "",
    password_confirmation: "",
  });

  async function getBrgyUsers() {
    try {
      const res = await fetch("/api/barangay-user", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      console.log(data);
      if (res.ok) {
        setBrgyUsers(data.barangay_users || []); // Default to empty array if data is undefined
      } else {
        setErrors([data.message || "Failed to load Barangay Users"]);
      }
    } catch (error) {
      setErrors(["Failed to fetch Barangay Users"]);
    } finally {
      setLoading(false); // Set loading to false after data is fetched
    }
  }

  const handleEdit = (brgyUser) => {
    setSelectedBrgyUser(brgyUser); // Set the selected admin for the modal
    setIsModalOpen(true); // Open the modal
    setFormData({
      email: brgyUser?.user?.email || "", // Safe access for email
      barangay: brgyUser.barangay || "",
      brgy_user_name: brgyUser.brgy_user_name || "",
    });
  };

  const handleSave = async (e) => {
    e.preventDefault(); // Prevent the form from submitting normally
    const { email, brgy_user_name, password, password_confirmation } = formData;

    const method = selectedBrgyUser ? "PUT" : "POST"; // Use PUT if editing, POST if creating
    const endpoint = selectedBrgyUser
      ? `/api/barangay-user/${selectedBrgyUser.id}`
      : "/api/barangay-user"; // Adjust endpoint based on the action (create vs update)

    try {
      const res = await fetch(endpoint, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          brgy_user_name,
          password,
          password_confirmation,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        // Refetch the list of Barangay Admins to ensure the table is up-to-date
        await getBrgyUsers();
        setIsModalOpen(false);
        setSelectedBrgyUser(null);
        setFormData({
          email: "",
          barangay: "",
          brgy_user_name: "",
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
    setSelectedBrgyUser(null); // Clear the selected post
    setFormData({
      email: "",
      barangay: "",
      brgy_user_name: "",
      password: "",
      password_confirmation: "",
    }); // Reset form data
  };

  const handleDelete = (brgyUser) => {
    setBrgyUserToDelete(brgyUser);
    setIsDeleteModalOpen(true);
  };

  async function confirmDelete() {
    if (!brgyUserToDelete) return;

    try {
      const res = await fetch(`/api/barangay-user/${brgyUserToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json(); // Parse the JSON response

      if (res.ok) {
        // Refresh the list after deletion
        await getBrgyUsers();
        setIsDeleteModalOpen(false);
      } else {
        console.error(
          "Error deleting barangay user:",
          data.message || "Unknown error"
        );
      }
    } catch (error) {
      console.error("An error occurred while deleting a barangay user:", error);
    }
  }

  async function confirmRestore() {
    if (!brgyUserToRestore) return;

    try {
      const res = await fetch(
        `/api/barangay-user/${brgyUserToRestore.id}/restore`,
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
        await getBrgyUsers();
        setIsRestoreModalOpen(false);
      } else {
        console.error(
          "Error restoring a barangay user:",
          data.message || "Unknown error"
        );
      }
    } catch (error) {
      console.error(
        "An error occurred while restoring a barangay admin:",
        error
      );
    }
  }
  const handleRestore = async (brgyUser) => {
    setBrgyUserToRestore(brgyUser);
    setIsRestoreModalOpen(true);
  };

  // Fetch Barangay Users when component mounts
  useEffect(() => {
    getBrgyUsers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Barangay Users</h1>
      <button
        onClick={() => {
          setIsModalOpen(true);
          setSelectedBrgyUser(null);
          setFormData({
            email: "",
            barangay: "",
            brgy_user_name: "",
            password: "",
            password_confirmation: "",
          });
        }}
        className="btn btn-primary mb-4"
      >
        Add a New Barangay User
      </button>
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
            <th className="px-4 py-2 text-left border">Brgy User Name</th>
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
          ) : brgyUsers.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-4 py-2 text-center border">
                No Barangay Users available.
              </td>
            </tr>
          ) : (
            brgyUsers.map((brgyUser) => (
              <tr key={brgyUser.id} className="border-b hover:bg-slate-100">
                <td className="px-4 py-2 border">
                  {brgyUser.brgy_user_name || "N/A"}
                </td>
                <td className="px-4 py-2 border">
                  {brgyUser.user?.email || "No Email"}
                </td>
                <td className="px-4 py-2 border">
                  {brgyUser.barangay.brgy_name || "N/A"}
                </td>
                <td
                  className={`px-4 py-2 border font-semibold ${
                    brgyUser.user?.status === "ACTIVE"
                      ? "text-green-600"
                      : brgyUser.user?.status === "INACTIVE"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {brgyUser.user?.status || "N/A"}
                </td>
                <td className="px-4 py-2 border flex space-x-2">
                  <button
                    onClick={() => handleEdit(brgyUser)}
                    className="btn btn-primary btn-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(brgyUser)}
                    className="btn btn-error btn-sm"
                  >
                    ❌ Delete
                  </button>
                  <button
                    onClick={() => handleRestore(brgyUser)}
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
      {/* Add Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h2 className="text-xl font-semibold mb-4">
              {selectedBrgyUser ? "Edit Brgy User" : "Add Brgy User"}
            </h2>
            <form onSubmit={handleSave}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Brgy User Name</span>
                </label>
                <input
                  className="input input-bordered"
                  type="text"
                  value={formData.brgy_user_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      brgy_user_name: e.target.value,
                    })
                  }
                />
              </div>
              {errors.brgy_user_name && (
                <p className="text-error">{errors.brgy_user_name[0]}</p>
              )}

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
              Are you sure you want to delete {brgyUserToDelete?.brgy_user_name}
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
              {brgyUserToRestore?.brgy_user_name}?
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
