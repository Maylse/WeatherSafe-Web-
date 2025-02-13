import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";

export default function BrgyAdmins() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [brgyAdminToDelete, setBrgyAdminToDelete] = useState(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [brgyAdminToRestore, setBrgyAdminToRestore] = useState(null);
  const [selectedBrgyAdmin, setSelectedBrgyAdmin] = useState(null);
  const { user, token, setUser, setToken } = useContext(AppContext);
  const [brgyAdmins, setBrgyAdmins] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    barangay: "",
    brgy_admin_name: "",
    password: "",
    password_confirmation: "",
  });

  async function getBrgyAdmins() {
    try {
      const res = await fetch("/api/barangay-admins", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        setBrgyAdmins(data.barangay_admins || []); // Default to empty array if data is undefined
      } else {
        setErrors([data.message || "Failed to load Barangay Admins"]);
      }
    } catch (error) {
      setErrors(["Failed to fetch Barangay Admins"]);
    } finally {
      setLoading(false); // Set loading to false after data is fetched
    }
  }

  const handleEdit = (brgyAdmin) => {
    setSelectedBrgyAdmin(brgyAdmin); // Set the selected admin for the modal
    setIsModalOpen(true); // Open the modal
    setFormData({
      email: brgyAdmin?.user?.email || "", // Safe access for email
      barangay: brgyAdmin.barangay || "",
      brgy_admin_name: brgyAdmin.brgy_admin_name || "",
    });
  };

  const handleSave = async (e) => {
    e.preventDefault(); // Prevent the form from submitting normally
    const {
      email,
      barangay,
      brgy_admin_name,
      password,
      password_confirmation,
    } = formData;

    const method = selectedBrgyAdmin ? "PUT" : "POST"; // Use PUT if editing, POST if creating
    const endpoint = selectedBrgyAdmin
      ? `/api/barangay-admins/${selectedBrgyAdmin.id}`
      : "/api/barangay-admins"; // Adjust endpoint based on the action (create vs update)

    try {
      const res = await fetch(endpoint, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          barangay,
          brgy_admin_name,
          password,
          password_confirmation,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        // Refetch the list of Barangay Admins to ensure the table is up-to-date
        await getBrgyAdmins();
        setIsModalOpen(false);
        setSelectedBrgyAdmin(null);
        setFormData({
          email: "",
          barangay: "",
          brgy_admin_name: "",
          password: "",
          password_confirmation: "",
        });
      } else {
        setErrors(data.errors || ["Something went wrong!"]);
      }
    } catch (error) {
      console.error("Error saving Barangay Admin:", error);
      setErrors(["Something went wrong!"]);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
    setSelectedBrgyAdmin(null); // Clear the selected post
    setFormData({
      email: "",
      barangay: "",
      brgy_admin_name: "",
      password: "",
      password_confirmation: "",
    }); // Reset form data
  };

  const handleDelete = (brgyAdmin) => {
    setBrgyAdminToDelete(brgyAdmin);
    setIsDeleteModalOpen(true);
  };

  async function confirmDelete() {
    if (!brgyAdminToDelete) return;

    try {
      const res = await fetch(`/api/barangay-admins/${brgyAdminToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json(); // Parse the JSON response

      if (res.ok) {
        // Refresh the list after deletion
        await getBrgyAdmins();
        setIsDeleteModalOpen(false);
      } else {
        console.error(
          "Error deleting barangay admin:",
          data.message || "Unknown error"
        );
      }
    } catch (error) {
      console.error(
        "An error occurred while deleting a barangay admin:",
        error
      );
    }
  }

  async function confirmRestore() {
    if (!brgyAdminToRestore) return;

    try {
      const res = await fetch(
        `/api/barangay-admins/${brgyAdminToRestore.id}/restore`,
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
        await getBrgyAdmins();
        setIsRestoreModalOpen(false);
      } else {
        console.error(
          "Error restoring a barangay admin:",
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
  const handleRestore = async (brgyAdmin) => {
    setBrgyAdminToRestore(brgyAdmin);
    setIsRestoreModalOpen(true);
  };

  // Fetch Barangay Admins when component mounts
  useEffect(() => {
    getBrgyAdmins();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Barangay Admins</h1>
      {/* Add New Barangay Admin Button */}
      <button
        onClick={() => {
          setIsModalOpen(true);
          setSelectedBrgyAdmin(null); // Ensure no selected admin
          setFormData({
            // Clear the form for new entries
            email: "",
            barangay: "",
            brgy_admin_name: "",
            password: "",
            password_confirmation: "",
          });
        }}
        className="btn btn-primary mb-4"
      >
        Add a New Barangay Admin
      </button>

      {/* Errors display */}
      {errors.length > 0 && (
        <div className="text-red-500">
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <table className="table-auto w-full text-sm border-collapse mt-4">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Brgy Admin Name</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Barangay</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? ( // Show a loading message until data is fetched
            <tr>
              <td colSpan="4" className="px-4 py-2 text-center">
                Loading...
              </td>
            </tr>
          ) : brgyAdmins.length === 0 ? (
            <tr>
              <td colSpan="4" className="px-4 py-2 text-center">
                No Barangay Admins available.
              </td>
            </tr>
          ) : (
            brgyAdmins.map((brgyAdmin) => {
              if (!brgyAdmin) {
                return (
                  <tr key="invalid-admin">
                    <td colSpan="4" className="px-4 py-2 text-center">
                      Invalid Barangay Admin
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={brgyAdmin.id} className="border-b hover:bg-slate-100">
                  <td className="px-4 py-2">{brgyAdmin.brgy_admin_name}</td>
                  <td className="px-4 py-2">
                    {brgyAdmin.user?.email || "No Email"}
                  </td>
                  <td className="px-4 py-2">{brgyAdmin.barangay}</td>
                  <td
                    className={`px-4 py-2 font-semibold ${
                      brgyAdmin.user?.status === "ACTIVE"
                        ? "text-green-600"
                        : brgyAdmin.user?.status === "INACTIVE"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {brgyAdmin.user?.status || "N/A"}
                  </td>
                  <td className="px-4 py-2 flex space-x-2">
                    <button
                      onClick={() => handleEdit(brgyAdmin)}
                      className="btn btn-primary btn-sm mr-2"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(brgyAdmin)}
                      className="btn btn-error btn-sm"
                    >
                      ❌ Delete
                    </button>

                    <button
                      onClick={() => handleRestore(brgyAdmin)}
                      className="btn btn-success btn-sm mr-2"
                    >
                      🔃 Restore
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h2 className="text-xl font-semibold mb-4">
              {selectedBrgyAdmin ? "Edit Brgy Admin" : "Add Brgy Admin"}
            </h2>
            <form onSubmit={handleSave}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Brgy Admin Name</span>
                </label>
                <input
                  className="input input-bordered"
                  type="text"
                  value={formData.brgy_admin_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      brgy_admin_name: e.target.value,
                    })
                  }
                />
              </div>
              {errors.brgy_admin_name && (
                <p className="text-error">{errors.brgy_admin_name[0]}</p>
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
                  <span className="label-text">Barangay</span>
                </label>
                <input
                  className="input input-bordered"
                  type="text"
                  value={formData.barangay}
                  onChange={(e) =>
                    setFormData({ ...formData, barangay: e.target.value })
                  }
                />
              </div>

              {errors.barangay && (
                <p className="text-error">{errors.barangay[0]}</p>
              )}

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
              Are you sure you want to delete{" "}
              {brgyAdminToDelete?.brgy_admin_name}?
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
              {brgyAdminToRestore?.brgy_admin_name}?
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
