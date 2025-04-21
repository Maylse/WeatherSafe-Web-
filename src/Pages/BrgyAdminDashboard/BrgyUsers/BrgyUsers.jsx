import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export default function BrgyUsers() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    profile: "",
  });

  const [previewImage, setPreviewImage] = useState(null);

  async function getBrgyUsers() {
    try {
      const res = await fetch(`${apiUrl}/api/barangay-user`, {
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

  const handleEdit = (brgyUser) => {
    setSelectedBrgyUser(brgyUser); // Set the selected admin for the modal
    setIsModalOpen(true); // Open the modal
    setFormData({
      email: brgyUser?.user?.email || "", // Safe access for email
      barangay: brgyUser.barangay || "",
      brgy_user_name: brgyUser.brgy_user_name || "",
      password: "",
      password_confirmation: "",
    });

    setPreviewImage(brgyUser.user?.profile); // Set existing image as preview
  };

  const handleSave = async (e) => {
    e.preventDefault(); // Prevent the form from submitting normally

    if (isSaving) return; // Prevent further clicks if saving is in progress
    setLoading(true);
    setIsSaving(true); // Disable the save button while saving

    // Check if the profile has been updated
    if (formData.profile instanceof File) {
      if (selectedBrgyUser && selectedBrgyUser.user.profile) {
        console.log("Deleting old image: ", selectedBrgyUser.user.profile); // Debugging step
        await handleDeleteImage(selectedBrgyUser.user.profile); // Delete the old image
      }

      // Upload the new image
      const imageUrl = await handleImageUpload(formData.profile);
      if (imageUrl) {
        formData.profile = imageUrl; // Save image URL after upload
      } else {
        alert("Failed to upload image.");
        setLoading(false);
        setIsSaving(false); // Re-enable the button
        return;
      }
    }

    const { email, brgy_user_name, profile, password, password_confirmation } =
      formData;

    const method = selectedBrgyUser ? "PUT" : "POST"; // Use PUT if editing, POST if creating
    const endpoint = selectedBrgyUser
      ? `${apiUrl}/api/barangay-user/${selectedBrgyUser.id}`
      : `${apiUrl}/api/barangay-user`; // Adjust endpoint based on the action (create vs update)

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
          profile,
          password,
          password_confirmation,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        // Refetch the list of Barangay Admins to ensure the table is up-to-date
        await getBrgyUsers();
        setIsModalOpen(false);
        setPreviewImage(null);
        setSelectedBrgyUser(null);
        setFormData({
          email: "",
          barangay: "",
          brgy_user_name: "",
          profile: "",
          password: "",
          password_confirmation: "",
        });
      } else {
        setErrors(data.errors || ["Something went wrong!"]);
      }
    } catch (error) {
      console.error("Error saving Barangay User:", error);
      setErrors(["Something went wrong!"]);
    } finally {
      setIsSaving(false); // Re-enable the button after the operation is finished
    }
  };

  const handleDelete = (brgyUser) => {
    setBrgyUserToDelete(brgyUser);
    setIsDeleteModalOpen(true);
  };

  async function confirmDelete() {
    if (!brgyUserToDelete) return;

    try {
      const res = await fetch(
        `${apiUrl}/api/barangay-user/${brgyUserToDelete.id}`,
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
        `${apiUrl}/api/barangay-user/${brgyUserToRestore.id}/restore`,
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
            profile: "",
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
      {/* Add Edit Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h2 className="text-xl font-semibold mb-4">
              {selectedBrgyUser ? "Edit Brgy User" : "Add Brgy User"}
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
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
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
