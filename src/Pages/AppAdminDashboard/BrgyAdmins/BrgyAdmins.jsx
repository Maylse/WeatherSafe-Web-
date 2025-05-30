import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";
import axios from "axios";

const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

export default function BrgyAdmins() {
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [brgyAdminToDelete, setBrgyAdminToDelete] = useState(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [brgyAdminToRestore, setBrgyAdminToRestore] = useState(null);
  const [selectedBrgyAdmin, setSelectedBrgyAdmin] = useState(null);
  const { user, token } = useContext(AppContext);
  const [brgyAdmins, setBrgyAdmins] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [brgyAdminToExtend, setBrgyAdminToExtend] = useState(null);
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

  // Fetch barangay admins using Axios
  async function getBrgyAdmins() {
    try {
      setLoading(true);
      const response = await axios.get(`${serverUrl}/api/barangay-admins`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBrgyAdmins(response.data.barangay_admins || []);
      setErrors([]);
    } catch (error) {
      console.error("Error fetching barangay admins:", error);
      setErrors(["Failed to fetch Barangay Admins"]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch barangays using Axios
  async function getBarangays() {
    try {
      const response = await axios.get(`${serverUrl}/api/barangays`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBarangays(response.data.barangays || []);
      setErrors([]);
    } catch (error) {
      console.error("Error fetching barangays:", error);
      setErrors(["Failed to fetch Barangays"]);
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

      console.log("Previous image deleted successfully");
    } catch (error) {
      console.error("Failed to delete previous image:", error);
    }
  };

  const handleEdit = (brgyAdmin) => {
    setSelectedBrgyAdmin(brgyAdmin);
    setIsModalOpen(true);
    setFormData({
      email: brgyAdmin?.user?.email || "",
      barangay: brgyAdmin.barangay || "",
      brgy_admin_name: brgyAdmin.brgy_admin_name || "",
      password: "",
      password_confirmation: "",
    });
    setPreviewImage(brgyAdmin.user?.profile);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setErrors([]);

    try {
      let updatedFormData = { ...formData };

      // Handle image upload if new file was selected
      if (formData.profile instanceof File) {
        if (selectedBrgyAdmin?.user?.profile) {
          await handleDeleteImage(selectedBrgyAdmin.user.profile);
        }
        const imageUrl = await handleImageUpload(formData.profile);
        if (!imageUrl) throw new Error("Image upload failed");
        updatedFormData.profile = imageUrl;
      }

      // Prepare the API call
      const method = selectedBrgyAdmin ? "put" : "post";
      const endpoint = selectedBrgyAdmin
        ? `${serverUrl}/api/barangay-admins/${selectedBrgyAdmin.id}`
        : `${serverUrl}/api/barangay-admins`;

      // Make the API call
      await axios[method](endpoint, updatedFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // On success
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
    } catch (error) {
      console.error("Error saving Barangay Admin:", error);
      if (error.response?.data?.errors) {
        setErrors(Object.values(error.response.data.errors).flat());
      } else {
        setErrors(["Something went wrong!"]);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (brgyAdmin) => {
    setBrgyAdminToDelete(brgyAdmin);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!brgyAdminToDelete) return;

    setIsSaving(true); // Show loading modal
    try {
      await axios.delete(
        `${serverUrl}/api/barangay-admins/${brgyAdminToDelete.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await getBrgyAdmins();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting barangay admin:", error);
    } finally {
      setIsSaving(false); // Hide loading modal
    }
  };

  const confirmRestore = async () => {
    if (!brgyAdminToRestore) return;

    setIsSaving(true); // Show loading modal
    try {
      await axios.patch(
        `${serverUrl}/api/barangay-admins/${brgyAdminToRestore.id}/restore`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await getBrgyAdmins();
      setIsRestoreModalOpen(false);
    } catch (error) {
      console.error("Error restoring barangay admin:", error);
    } finally {
      setIsSaving(false); // Hide loading modal
    }
  };

  const handleRestore = (brgyAdmin) => {
    setBrgyAdminToRestore(brgyAdmin);
    setIsRestoreModalOpen(true);
  };
  const handleExtendSubscription = (brgyAdmin) => {
    if (!brgyAdmin?.id) {
      console.error("Invalid barangay admin data:", brgyAdmin);
      alert("Cannot extend subscription - invalid admin data");
      return;
    }
    setBrgyAdminToExtend(brgyAdmin);
    setIsExtendModalOpen(true);
  };

  const confirmExtendSubscription = async () => {
    if (!brgyAdminToExtend?.id) {
      setModalMessage("No barangay admin selected for extension");
      setIsError(true);
      setIsMessageModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      const response = await axios.post(
        `${serverUrl}/api/barangay-admins/${brgyAdminToExtend.id}/extend-subscription`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await getBrgyAdmins();
      setIsExtendModalOpen(false);
      setModalMessage(
        `Subscription extended until ${new Date(
          response.data.new_subscription_end
        ).toLocaleDateString()}`
      );
      setIsError(false);
      setIsMessageModalOpen(true);
    } catch (error) {
      console.error("Error extending subscription:", error);
      setModalMessage(
        error.response?.data?.message || "Failed to extend subscription"
      );
      setIsError(true);
      setIsMessageModalOpen(true);
    } finally {
      setIsSaving(false);
    }
  };
  useEffect(() => {
    getBrgyAdmins();
    getBarangays();
  }, []);

  function LoadingModal({ isOpen, message }) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
        <div className="modal-box p-6 rounded-lg shadow-lg max-w-sm w-full z-[101]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white">
              {message || "Processing, please wait..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  function MessageModal({ isOpen, message, isError, onClose }) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
        <div className="modal-box p-6 rounded-lg shadow-lg max-w-sm w-full z-[101]">
          <h3
            className={`text-lg font-bold mb-4 ${
              isError ? "text-red-600" : "text-green-600"
            }`}
          >
            {isError ? "Error" : "Success"}
          </h3>
          <p className="mb-4">{message}</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`btn ${isError ? "btn-error" : "btn-success"}`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6">
      {/* Add the LoadingModal near the top of your component */}
      <LoadingModal
        isOpen={isSaving}
        message={
          isDeleteModalOpen
            ? "Deleting Barangay Admin..."
            : isRestoreModalOpen
            ? "Restoring Barangay Admin..."
            : isExtendModalOpen
            ? "Extending Subscription..."
            : selectedBrgyAdmin
            ? "Updating Barangay Admin..."
            : "Creating Barangay Admin..."
        }
      />
      {/* Message Modal */}
      <MessageModal
        isOpen={isMessageModalOpen}
        message={modalMessage}
        isError={isError}
        onClose={() => setIsMessageModalOpen(false)}
      />
      <h1 className="text-2xl font-bold mb-4 text-black">Barangay Admins</h1>
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

      <table className="table-auto w-full text-sm border-collapse mt-4 text-black">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Brgy Admin Name</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Barangay</th>
            <th className="px-4 py-2 text-left">Subscription Start</th>
            <th className="px-4 py-2 text-left">Subscription End</th>
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
                  <td className="px-4 py-2">
                    {brgyAdmin.subscription_start
                      ? new Date(
                          brgyAdmin.subscription_start
                        ).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td
                    className={`px-4 py-2 ${
                      brgyAdmin.subscription_end &&
                      new Date(brgyAdmin.subscription_end) < new Date()
                        ? "text-red-600 font-bold"
                        : "text-gray-600"
                    }`}
                  >
                    {brgyAdmin.subscription_end
                      ? new Date(
                          brgyAdmin.subscription_end
                        ).toLocaleDateString()
                      : "N/A"}
                  </td>
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
                    <button
                      onClick={() => handleExtendSubscription(brgyAdmin)}
                      className="btn btn-warning btn-sm"
                      title="Extend subscription by 1 month"
                    >
                      ⏳ Extend
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div
          className={`modal modal-open z-50 ${
            isSaving ? "pointer-events-none" : ""
          }`}
        >
          <div className="modal-box relative">
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
                <select
                  className="select select-bordered w-full"
                  value={formData.barangay}
                  onChange={(e) =>
                    setFormData({ ...formData, barangay: e.target.value })
                  }
                  required
                >
                  <option value="">Select Barangay</option>
                  {barangays.map((barangay) => (
                    <option key={barangay.id} value={barangay.brgy_name}>
                      {barangay.brgy_name}
                    </option>
                  ))}
                </select>
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
      {isExtendModalOpen && (
        <div
          className={`modal modal-open z-50 ${
            isSaving ? "pointer-events-none" : ""
          }`}
        >
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              Confirm Subscription Extension
            </h3>
            <p className="py-4">
              Are you sure you want to extend{" "}
              {brgyAdminToExtend?.brgy_admin_name}'s subscription by 1 month?
            </p>
            <div className="modal-action">
              <button
                className="btn btn-warning"
                onClick={confirmExtendSubscription}
              >
                Yes, Extend
              </button>
              <button
                className="btn"
                onClick={() => setIsExtendModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className={`modal modal-open z-50 ${
            isSaving ? "pointer-events-none" : ""
          }`}
        >
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
        <div
          className={`modal modal-open z-50 ${
            isSaving ? "pointer-events-none" : ""
          }`}
        >
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
