import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export default function BrgyAdmins() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    profile: "",
    password: "",
    password_confirmation: "",
  });

  const [previewImage, setPreviewImage] = useState(null);

  async function getBrgyAdmins() {
    try {
      const res = await fetch(`${apiUrl}/api/barangay-admins`, {
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

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result); // Update preview with new image
      };
      reader.readAsDataURL(file);
      setFormData({ ...formData, profile: file }); // Store new file in formData
    }
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "WeatherSafePreset"); // Ensure this preset exists in Cloudinary

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dkx4tszqm/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = await response.json();
      return data.secure_url; // The URL of the uploaded image
    } catch (error) {
      console.error("Image upload failed:", error);
      return null;
    }
  };

  const extractPublicId = (imageUrl) => {
    if (!imageUrl) return null;

    // Remove Cloudinary base URL
    const urlParts = imageUrl.split("/");

    // Find the index of 'upload' and ignore version numbers
    const uploadIndex = urlParts.findIndex((part) => part === "upload");
    if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) return null;

    // Extract parts after 'upload' (excluding version)
    const relevantParts = urlParts.slice(uploadIndex + 2); // Skip 'upload' + version

    // Join folder structure (if any) and filename without extension
    const publicId = relevantParts.join("/").split(".")[0];

    return publicId;
  };

  const handleDeleteImage = async (imageUrl) => {
    if (!imageUrl) return;

    console.log("Image URL before extracting publicId:", imageUrl);

    const publicId = extractPublicId(imageUrl); // Use the corrected function

    console.log("Extracted Public ID:", publicId);

    if (!publicId) {
      console.error("Failed to extract a valid public ID.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/delete-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ publicId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      console.log("Previous image deleted successfully");
    } catch (error) {
      console.error("Failed to delete previous image:", error);
    }
  };

  const handleEdit = (brgyAdmin) => {
    setSelectedBrgyAdmin(brgyAdmin); // Set the selected admin for the modal
    setIsModalOpen(true); // Open the modal
    setFormData({
      email: brgyAdmin?.user?.email || "", // Safe access for email
      barangay: brgyAdmin.barangay || "",
      brgy_admin_name: brgyAdmin.brgy_admin_name || "",
      password: "",
      password_confirmation: "",
    });
    console.log(brgyAdmin);
    setPreviewImage(brgyAdmin.user?.profile); // Set existing image as preview
  };

  const handleSave = async (e) => {
    e.preventDefault(); // Prevent the form from submitting normally

    if (isSaving) return; // Prevent further clicks if saving is in progress

    setIsSaving(true); // Disable the save button while saving

    // Check if the profile has been updated
    if (formData.profile instanceof File) {
      // If a new file is chosen, first delete the old image if it exists
      if (selectedBrgyAdmin && selectedBrgyAdmin.user.profile) {
        await handleDeleteImage(selectedBrgyAdmin.user.profile); // Delete the old image
      }

      // Upload the new image
      const imageUrl = await handleImageUpload(formData.profile);
      if (imageUrl) {
        formData.profile = imageUrl; // Save image URL after upload
      } else {
        alert("Failed to upload image.");
        setIsSaving(false); // Re-enable the button
        return;
      }
    }

    const {
      email,
      barangay,
      brgy_admin_name,
      profile,
      password,
      password_confirmation,
    } = formData;

    const method = selectedBrgyAdmin ? "PUT" : "POST"; // Use PUT if editing, POST if creating
    const endpoint = selectedBrgyAdmin
      ? `${apiUrl}/api/barangay-admins/${selectedBrgyAdmin.id}`
      : `${apiUrl}/api/barangay-admins`; // Adjust endpoint based on the action (create vs update)

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
          profile,
          password,
          password_confirmation,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        // Refetch the list of Barangay Admins to ensure the table is up-to-date
        await getBrgyAdmins();
        setIsModalOpen(false);
        setPreviewImage(null);
        setSelectedBrgyAdmin(null);
        setFormData({
          email: "",
          barangay: "",
          brgy_admin_name: "",
          profile: "",
          password: "",
          password_confirmation: "",
        });
      } else {
        setErrors(data.errors || ["Something went wrong!"]);
      }
    } catch (error) {
      console.error("Error saving Barangay Admin:", error);
      setErrors(["Something went wrong!"]);
    } finally {
      setIsSaving(false); // Re-enable the button after the operation is finished
    }
  };

  const handleDelete = (brgyAdmin) => {
    setBrgyAdminToDelete(brgyAdmin);
    setIsDeleteModalOpen(true);
  };

  async function confirmDelete() {
    if (!brgyAdminToDelete) return;

    try {
      const res = await fetch(
        `${apiUrl}/api/barangay-admins/${brgyAdminToDelete.id}`,
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
        `${apiUrl}/api/barangay-admins/${brgyAdminToRestore.id}/restore`,
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

            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Profile Picture
              </label>
              <div
                className="relative w-24 h-24 rounded-full border border-gray-300 shadow-md flex items-center justify-center cursor-pointer hover:opacity-80 transition"
                onClick={() => document.getElementById("fileInput").click()}
              >
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile Preview"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-10 h-10 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>
              {/* Hidden File Input */}
              <input
                id="fileInput"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

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
