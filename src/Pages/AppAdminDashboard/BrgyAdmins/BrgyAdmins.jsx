import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";

export default function BrgyAdmins() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        console.log("API response:", data); // Log the response to verify the structure
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

        // Close modal and reset form
        navigate("/brgy-admins");
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

  // Handle delete operation
  const handleDelete = async (brgyAdminId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this admin?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/barangay-admins/${brgyAdminId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setBrgyAdmins((prevBrgyAdmins) =>
          prevBrgyAdmins.filter((brgyAdmin) => brgyAdmin.id !== brgyAdminId)
        ); // Remove deleted admin from the list
        alert("Barangay Admin deleted successfully!");
      } else {
        setErrors([data.message || "Failed to delete admin"]);
      }
    } catch (error) {
      setErrors(["An error occurred while deleting the admin."]);
    }
  };

  // Fetch Barangay Admins when component mounts
  useEffect(() => {
    getBrgyAdmins();
  }, []);

  return (
    <div>
      <h1 className="title">Barangay Admins</h1>
      {/* Add Post Button */}
      <button
        onClick={() => {
          setIsModalOpen(true); // Open the modal for creating a new post
          setSelectedBrgyAdmin(null); // Clear selected post (in case we had an edit mode before)
          setFormData({
            email: "",
            barangay: "",
            brgy_admin_name: "",
            password: "",
            password_confirmation: "",
          }); // Reset form data
        }}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4"
      >
        Add New Barangay Admin
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
              console.log(brgyAdmin); // Log the brgyAdmin object

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
                  <td className="px-4 py-2 flex space-x-2">
                    <button
                      onClick={() => handleEdit(brgyAdmin)}
                      className="text-blue-500 hover:text-blue-700"
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
              );
            })
          )}
        </tbody>
      </table>

      {/* Modal for editing */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-overlay flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              {selectedBrgyAdmin ? "Edit Barangay Admin" : "Add Barangay Admin"}
            </h2>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block mb-2">Brgy Admin Name</label>
                <input
                  type="text"
                  value={formData.brgy_admin_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      brgy_admin_name: e.target.value,
                    })
                  }
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Barangay</label>
                <input
                  type="text"
                  value={formData.barangay}
                  onChange={(e) =>
                    setFormData({ ...formData, barangay: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={formData.password_confirmation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password_confirmation: e.target.value,
                    })
                  }
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
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
