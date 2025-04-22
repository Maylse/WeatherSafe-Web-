import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";
import axios from "axios";

const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

export default function BrgyUsers() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [brgyUserToDelete, setBrgyUserToDelete] = useState(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [brgyUserToRestore, setBrgyUserToRestore] = useState(null);
  const [selectedBrgyUser, setSelectedBrgyUser] = useState(null);
  const { user, token } = useContext(AppContext);
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

  // Fetch barangay users using Axios
  async function getBrgyUsers() {
    try {
      setLoading(true);
      const response = await axios.get(`${serverUrl}/api/barangay-user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBrgyUsers(response.data.barangay_users || []);
      setErrors([]);
    } catch (error) {
      console.error("Error fetching barangay users:", error);
      setErrors(["Failed to fetch Barangay Users"]);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData({ ...formData, profile: file });
    }
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "WeatherSafePreset");

    try {
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dkx4tszqm/image/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data.secure_url;
    } catch (error) {
      console.error("Image upload failed:", error);
      return null;
    }
  };

  const extractPublicId = (imageUrl) => {
    if (!imageUrl) return null;
    const urlParts = imageUrl.split("/");
    const uploadIndex = urlParts.findIndex((part) => part === "upload");
    if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) return null;
    const relevantParts = urlParts.slice(uploadIndex + 2);
    return relevantParts.join("/").split(".")[0];
  };

  const handleDeleteImage = async (imageUrl) => {
    const publicId = extractPublicId(imageUrl);
    if (!publicId) return;

    try {
      await axios.post(
        `${serverUrl}/api/delete-image`,
        { publicId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Failed to delete previous image:", error);
    }
  };

  const handleEdit = (brgyUser) => {
    setSelectedBrgyUser(brgyUser);
    setIsModalOpen(true);
    setFormData({
      email: brgyUser?.user?.email || "",
      barangay: brgyUser.barangay || "",
      brgy_user_name: brgyUser.brgy_user_name || "",
      password: "",
      password_confirmation: "",
    });
    setPreviewImage(brgyUser.user?.profile);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors([]);

    try {
      // Handle image upload if new file was selected
      let updatedFormData = { ...formData };
      if (formData.profile instanceof File) {
        if (selectedBrgyUser?.user?.profile) {
          await handleDeleteImage(selectedBrgyUser.user.profile);
        }
        const imageUrl = await handleImageUpload(formData.profile);
        if (!imageUrl) throw new Error("Image upload failed");
        updatedFormData.profile = imageUrl;
      }

      // Prepare the API call
      const method = selectedBrgyUser ? "put" : "post";
      const endpoint = selectedBrgyUser
        ? `${serverUrl}/api/barangay-user/${selectedBrgyUser.id}`
        : `${serverUrl}/api/barangay-user`;

      const response = await axios[method](endpoint, updatedFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // On success
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
    } catch (error) {
      console.error("Error saving Barangay User:", error);
      if (error.response?.data?.errors) {
        setErrors(Object.values(error.response.data.errors).flat());
      } else {
        setErrors(["Something went wrong!"]);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (brgyUser) => {
    setBrgyUserToDelete(brgyUser);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!brgyUserToDelete) return;

    try {
      await axios.delete(
        `${serverUrl}/api/barangay-user/${brgyUserToDelete.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await getBrgyUsers();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting barangay user:", error);
    }
  };

  const confirmRestore = async () => {
    if (!brgyUserToRestore) return;

    try {
      await axios.patch(
        `${serverUrl}/api/barangay-user/${brgyUserToRestore.id}/restore`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await getBrgyUsers();
      setIsRestoreModalOpen(false);
    } catch (error) {
      console.error("Error restoring barangay user:", error);
    }
  };

  const handleRestore = (brgyUser) => {
    setBrgyUserToRestore(brgyUser);
    setIsRestoreModalOpen(true);
  };

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
        Add New Barangay User
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
        <table className="table-auto w-full text-sm border-collapse mt-4">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Brgy User Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Barangay</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-4 py-2 text-center">
                  Loading...
                </td>
              </tr>
            ) : brgyUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-2 text-center">
                  No Barangay Users available.
                </td>
              </tr>
            ) : (
              brgyUsers.map((brgyUser) => (
                <tr key={brgyUser.id} className="border-b hover:bg-slate-100">
                  <td className="px-4 py-2">{brgyUser.brgy_user_name}</td>
                  <td className="px-4 py-2">{brgyUser.user?.email || "N/A"}</td>
                  <td className="px-4 py-2">
                    {brgyUser.barangay?.brgy_name || "N/A"}
                  </td>
                  <td
                    className={`px-4 py-2 font-semibold ${
                      brgyUser.user?.status === "ACTIVE"
                        ? "text-green-600"
                        : brgyUser.user?.status === "INACTIVE"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {brgyUser.user?.status || "N/A"}
                  </td>
                  <td className="px-4 py-2 space-x-2">
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
      </div>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h2 className="text-xl font-semibold mb-4">
              {selectedBrgyUser ? "Edit Barangay User" : "Add Barangay User"}
            </h2>

            <div className="flex flex-col items-center gap-2 mb-4">
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
              <input
                id="fileInput"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Barangay User Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.brgy_user_name}
                  onChange={(e) =>
                    setFormData({ ...formData, brgy_user_name: e.target.value })
                  }
                  required
                />
                {errors.brgy_user_name && (
                  <p className="text-error">{errors.brgy_user_name[0]}</p>
                )}
              </div>

              <div className="form-control">
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

              <div className="form-control">
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
                />
                {errors.password && (
                  <p className="text-error">{errors.password[0]}</p>
                )}
              </div>

              <div className="form-control">
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
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
