import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

// Map container style
const containerStyle = {
  width: "100%",
  height: "400px",
};

export default function Announcements() {
  const { user, token } = useContext(AppContext);
  const [announcements, setAnnouncements] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState({
    list: false,
    add: false,
    edit: false,
    delete: false,
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    id: null,
  });
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAnnouncementId, setCurrentAnnouncementId] = useState(null);
  const [center, setCenter] = useState({
    lat: 10.3157, // Default Cebu coordinates
    lng: 123.8854,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    headline: "",
    message: "",
    start_time: "",
    end_time: "",
    long: "",
    lat: "",
  });
  const [timeError, setTimeError] = useState("");

  // Fetch announcements sorted by start time (newest first)
  async function getAnnouncements() {
    try {
      setLoading((prev) => ({ ...prev, list: true }));
      const response = await axios.get(`${serverUrl}/api/announcements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Sort announcements by start time (newest first)
      const sortedAnnouncements = response.data.announcements
        ? [...response.data.announcements].sort((a, b) => {
            return new Date(b["start-time"]) - new Date(a["start-time"]);
          })
        : [];

      setAnnouncements(sortedAnnouncements);
      setErrors([]);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setErrors(["Failed to fetch announcements"]);
    } finally {
      setLoading((prev) => ({ ...prev, list: false }));
    }
  }

  useEffect(() => {
    getAnnouncements();
    if (showModal && !isEditing) {
      getUserLocation();
    }
  }, [showModal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Validate time inputs when they change
    if (name === "start_time" || name === "end_time") {
      validateTimes(name, value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate that end time is after start time
  const validateTimes = (changedField, newValue) => {
    if (!formData.start_time || !formData.end_time) return;

    const startTime =
      changedField === "start_time"
        ? new Date(newValue)
        : new Date(formData.start_time);

    const endTime =
      changedField === "end_time"
        ? new Date(newValue)
        : new Date(formData.end_time);

    if (endTime <= startTime) {
      setTimeError("End time must be after start time");
    } else {
      setTimeError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final time validation before submission
    const startTime = new Date(formData.start_time);
    const endTime = new Date(formData.end_time);

    if (endTime <= startTime) {
      setTimeError("End time must be after start time");
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, [isEditing ? "edit" : "add"]: true }));
      let response;

      if (isEditing) {
        response = await axios.put(
          `${serverUrl}/api/announcements/${currentAnnouncementId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        response = await axios.post(
          `${serverUrl}/api/announcements`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Refresh announcements after update/create
      await getAnnouncements();

      setFormData({
        headline: "",
        message: "",
        start_time: "",
        end_time: "",
        long: "",
        lat: "",
      });
      setSelectedLocation(null);
      setShowModal(false);
      setIsEditing(false);
      setCurrentAnnouncementId(null);
      setErrors([]);
      setTimeError("");
    } catch (error) {
      console.error("Error saving announcement:", error);
      setErrors(
        error.response?.data?.message || [
          `Failed to ${isEditing ? "update" : "create"} announcement`,
        ]
      );
    } finally {
      setLoading((prev) => ({ ...prev, [isEditing ? "edit" : "add"]: false }));
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      headline: announcement.headline,
      message: announcement.message,
      start_time: format(
        parseISO(announcement["start-time"]),
        "yyyy-MM-dd'T'HH:mm"
      ),
      end_time: format(
        parseISO(announcement["end-time"]),
        "yyyy-MM-dd'T'HH:mm"
      ),
      long: announcement.long.toString(),
      lat: announcement.lat.toString(),
    });
    setSelectedLocation({
      lat: parseFloat(announcement.lat),
      lng: parseFloat(announcement.long),
    });
    setCenter({
      lat: parseFloat(announcement.lat),
      lng: parseFloat(announcement.long),
    });
    setIsEditing(true);
    setCurrentAnnouncementId(announcement.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      setLoading((prev) => ({ ...prev, delete: true }));
      await axios.delete(`${serverUrl}/api/announcements/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAnnouncements((prev) =>
        prev.filter((announcement) => announcement.id !== id)
      );
      setErrors([]);
    } catch (error) {
      console.error("Error deleting announcement:", error);
      setErrors(["Failed to delete announcement"]);
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }));
      setDeleteConfirmation({ isOpen: false, id: null });
    }
  };

  const openDeleteConfirmation = (id) => {
    setDeleteConfirmation({ isOpen: true, id });
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenter({ lat: latitude, lng: longitude });
          setSelectedLocation({ lat: latitude, lng: longitude });
          setFormData((prev) => ({
            ...prev,
            lat: latitude.toString(),
            long: longitude.toString(),
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          // Use default Cebu coordinates if geolocation fails
          setSelectedLocation(center);
          setFormData((prev) => ({
            ...prev,
            lat: center.lat.toString(),
            long: center.lng.toString(),
          }));
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      // Use default Cebu coordinates if geolocation not supported
      setSelectedLocation(center);
      setFormData((prev) => ({
        ...prev,
        lat: center.lat.toString(),
        long: center.lng.toString(),
      }));
    }
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setSelectedLocation({ lat, lng });
    setFormData((prev) => ({
      ...prev,
      lat: lat.toString(),
      long: lng.toString(),
    }));
  };

  const handleModalClose = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentAnnouncementId(null);
    setErrors([]);
    setSelectedLocation(null);
    setTimeError("");
    setFormData({
      headline: "",
      message: "",
      start_time: "",
      end_time: "",
      long: "",
      lat: "",
    });
  };

  function LoadingModal({ isOpen, message }) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
          <div className="flex flex-col items-center">
            <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
            <p className="text-lg font-medium">
              {message || "Processing, please wait..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <h1 className="text-3xl font-bold mb-8">Announcements</h1>

      {/* Loading Modals */}
      <LoadingModal isOpen={loading.add} message="Creating announcement..." />
      <LoadingModal isOpen={loading.edit} message="Updating announcement..." />
      <LoadingModal
        isOpen={loading.delete}
        message="Deleting announcement..."
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="modal modal-open  z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Delete</h3>
            <p className="py-4">
              Are you sure you want to delete this announcement?
            </p>
            <div className="modal-action">
              <button
                onClick={() =>
                  setDeleteConfirmation({ isOpen: false, id: null })
                }
                className="btn btn-ghost"
                disabled={loading.delete}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmation.id)}
                className="btn btn-error"
                disabled={loading.delete}
              >
                {loading.delete ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="alert alert-error mb-4">
          {errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
      {/* Add Announcement Button */}
      {user?.userType === "barangay_admin" && (
        <div className="mb-6">
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
            disabled={loading.list}
          >
            {loading.list ? "Loading..." : "Add New Announcement"}
          </button>
        </div>
      )}

      {/* Modal Overlay */}
      {showModal && (
        <div
          className={`modal modal-open z-50 ${
            loading.add || loading.edit ? "pointer-events-none" : ""
          }`}
        >
          <div className="modal-box relative max-w-4xl">
            <h2 className="text-xl font-semibold mb-4">
              {isEditing ? "Edit Announcement" : "Create New Announcement"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Headline</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  name="headline"
                  value={formData.headline}
                  onChange={handleInputChange}
                  required
                  disabled={loading.add || loading.edit}
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Message</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-32"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  disabled={loading.add || loading.edit}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Start Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input input-bordered"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                    disabled={loading.add || loading.edit}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">End Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input input-bordered"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    required
                    disabled={loading.add || loading.edit}
                  />
                  {timeError && (
                    <p className="text-error text-sm mt-1">{timeError}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="h-96 rounded-lg overflow-hidden">
                  <LoadScript googleMapsApiKey="AIzaSyAzJLgjpVEgj5a-vC5FExOjygowRk05QJE">
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      center={center}
                      zoom={15}
                      onClick={handleMapClick}
                    >
                      {selectedLocation && (
                        <Marker position={selectedLocation} />
                      )}
                    </GoogleMap>
                  </LoadScript>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Latitude</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    name="lat"
                    value={formData.lat}
                    onChange={handleInputChange}
                    required
                    readOnly
                    disabled={loading.add || loading.edit}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Longitude</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    name="long"
                    value={formData.long}
                    onChange={handleInputChange}
                    required
                    readOnly
                    disabled={loading.add || loading.edit}
                  />
                </div>
              </div>

              {errors.length > 0 && (
                <div className="alert alert-error mb-4">
                  {errors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="btn btn-ghost"
                  disabled={loading.add || loading.edit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading.add || loading.edit || timeError}
                >
                  {loading.add || loading.edit
                    ? "Processing..."
                    : isEditing
                    ? "Update"
                    : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {loading.list && announcements.length === 0 ? (
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="alert alert-info">
          <span>No announcements found.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <h2 className="card-title text-xl">
                    {announcement.headline}
                  </h2>
                  {/* In your announcements list, update the delete button: */}
                  {user?.userType === "barangay_admin" && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="btn btn-sm btn-info"
                        disabled={loading.edit || loading.delete}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteConfirmation(announcement.id)}
                        className="btn btn-sm btn-error"
                        disabled={loading.edit || loading.delete}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-gray-700 mb-4">{announcement.message}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Start Time</p>
                    <p>
                      {format(
                        parseISO(announcement["start-time"]),
                        "MMMM d, yyyy h:mm a"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Time</p>
                    <p>
                      {format(
                        parseISO(announcement["end-time"]),
                        "MMMM d, yyyy h:mm a"
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p>
                      Lat: {announcement.lat}, Long: {announcement.long}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Posted by</p>
                    <p>{announcement.user?.name || "Unknown user"}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
