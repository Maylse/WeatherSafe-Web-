import { useContext, useEffect, useState } from "react";
import { AppContext } from "../Context/AppContext";
import axios from "axios";

const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

export default function Profile() {
  const { user, setUser, token } = useContext(AppContext);
  const [profileData, setProfileData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
    profile: "",
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await axios.get(`${serverUrl}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfileData(response.data.user);
        setFormData({
          name: response.data.user.name,
          email: response.data.user.email,
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
          profile: response.data.user.profile || "",
        });
        setPreviewImage(response.data.user.profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }

    if (user?.userType) {
      fetchProfile();
    }
  }, [user]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      setImageFile(file);

      if (formData.profile) {
        handleDeleteImage(formData.profile);
      }
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
      await axios.post(`${serverUrl}/api/delete-image`, { publicId });
    } catch (error) {
      console.error("Failed to delete previous image:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Upload new image if selected
      let updatedFormData = { ...formData };
      if (imageFile) {
        const imageUrl = await handleImageUpload(imageFile);
        if (!imageUrl) throw new Error("Image upload failed");
        updatedFormData.profile = imageUrl;
      }

      // Validate passwords if changing
      if (updatedFormData.new_password) {
        if (
          updatedFormData.new_password !==
          updatedFormData.new_password_confirmation
        ) {
          throw new Error("New passwords do not match");
        }
        if (!updatedFormData.current_password) {
          throw new Error("Current password is required to change password");
        }
      }

      // Prepare request data
      const requestData = {
        name: updatedFormData.name,
        email: updatedFormData.email,
        profile: updatedFormData.profile,
      };

      // Include password fields only if changing password
      if (updatedFormData.new_password) {
        requestData.current_password = updatedFormData.current_password;
        requestData.new_password = updatedFormData.new_password;
        requestData.new_password_confirmation =
          updatedFormData.new_password_confirmation;
      }

      const response = await axios.put(
        `${serverUrl}/api/user/profile`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update state on success
      setProfileData(response.data.user);
      setUser(response.data.user);
      setIsModalOpen(false);
      setPreviewImage(response.data.user.profile);
      setImageFile(null);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(
        err.response?.data?.message || err.message || "An error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!profileData) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile</h2>
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={previewImage || "https://placehold.co/100"}
          alt="User Profile"
          className="w-24 h-24 rounded-full border border-gray-300"
        />
        <div>
          <p className="text-lg font-semibold text-black">{profileData.name}</p>
          <p className="text-sm text-black">{profileData.email}</p>
        </div>
      </div>
      <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
        Edit Profile
      </button>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h2 className="text-xl font-bold mb-4">Update Profile</h2>
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}
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
                  <span className="label-text">Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Current Password</span>
                  <span className="label-text-alt">
                    (required to change password)
                  </span>
                </label>
                <input
                  type="password"
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">New Password</span>
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Confirm New Password</span>
                </label>
                <input
                  type="password"
                  name="new_password_confirmation"
                  value={formData.new_password_confirmation}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div className="modal-action">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
