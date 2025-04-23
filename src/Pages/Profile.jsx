import { useContext, useEffect, useState } from "react";
import { AppContext } from "../Context/AppContext";

export default function Profile() {
  const { token, user, setUser } = useContext(AppContext);
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
        const response = await fetch("/api/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfileData(data.user);
        setFormData({
          name: data.user.name,
          email: data.user.email,
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
          profile: data.user.profile || "",
        });
        setPreviewImage(data.user.profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }

    if (user?.userType) {
      fetchProfile();
    }
  }, [user, token]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result); // Update preview with new image
      };
      reader.readAsDataURL(file);
      setImageFile(file); // Store file for upload

      // If there's an existing image, delete it before uploading the new one
      if (formData.profile) {
        handleDeleteImage(formData.profile);
      }
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
      const response = await fetch("/api/delete-image", {
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (imageFile) {
      // Upload the new image and get the image URL (upload logic)
      const imageUrl = await handleImageUpload(imageFile);
      if (imageUrl) {
        formData.profile = imageUrl;
      } else {
        alert("Failed to upload image.");
        setLoading(false);
        return;
      }
    }

    const {
      name,
      email,
      current_password,
      new_password,
      new_password_confirmation,
      profile,
    } = formData;

    // Check if new password is provided, and if so, validate it
    if (new_password && new_password !== new_password_confirmation) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const bodyData = {
        name,
        email,
        profile,
      };

      // Add password fields only if provided
      if (new_password) {
        bodyData.current_password = current_password;
        bodyData.new_password = new_password;
        bodyData.new_password_confirmation = new_password_confirmation;
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      alert("Profile updated successfully!");
      setProfileData((prevData) => ({
        ...prevData,
        name,
        email,
        profile: formData.profile || prevData.profile,
      }));
      setUser((prevUser) => ({
        ...prevUser,
        name,
        email,
        profile: formData.profile || prevUser.profile,
      }));
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message);
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
            {error && <p className="text-red-500 text-sm">{error}</p>}
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
              <input
                id="fileInput"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div>
                <label className="label">Current Password (Optional)</label>
                <input
                  type="password"
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                />
              </div>
              <div>
                <label className="label">New Password (Optional)</label>
                <input
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                />
              </div>
              <div>
                <label className="label">Confirm New Password (Optional)</label>
                <input
                  type="password"
                  name="new_password_confirmation"
                  value={formData.new_password_confirmation}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                />
              </div>
              <div className="modal-action">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
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
