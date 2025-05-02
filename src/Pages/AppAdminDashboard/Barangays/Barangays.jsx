import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../Context/AppContext";
import { useNavigate } from "react-router-dom";

import axios from "axios";

const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

export default function Barangays() {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [barangayToDelete, setBarangayToDelete] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const { user, token } = useContext(AppContext);
  const [barangays, setBarangays] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    brgy_name: "",
    city: "",
  });

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

  const handleEdit = (barangay) => {
    setSelectedBarangay(barangay);
    setIsModalOpen(true);
    setFormData({
      brgy_name: barangay.brgy_name || "",
      city: barangay.city || "",
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrors([]);
    setIsSaving(true); // Show loading modal

    try {
      const method = selectedBarangay ? "put" : "post";
      const endpoint = selectedBarangay
        ? `${serverUrl}/api/barangays/${selectedBarangay.id}`
        : `${serverUrl}/api/barangays`;

      const response = await axios[method](endpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // On success
      await getBarangays();
      setIsModalOpen(false);
      setSelectedBarangay(null);
      setFormData({ brgy_name: "", city: "" });
    } catch (error) {
      console.error("Error saving barangay:", error);
      if (error.response?.data?.errors) {
        setErrors(Object.values(error.response.data.errors).flat());
      } else {
        setErrors(["Something went wrong!"]);
      }
    } finally {
      setIsSaving(false); // Hide loading modal
    }
  };

  const handleDelete = (barangay) => {
    setBarangayToDelete(barangay);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!barangayToDelete) return;
    setIsDeleting(true); // Show loading modal

    try {
      await axios.delete(`${serverUrl}/api/barangays/${barangayToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state to remove the deleted barangay
      setBarangays(barangays.filter((b) => b.id !== barangayToDelete.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting barangay:", error);
      setErrors(["Failed to delete barangay"]);
    } finally {
      setIsDeleting(false); // Hide loading modal
    }
  };
  useEffect(() => {
    if (token) {
      // Only fetch if token exists
      getBarangays();
    }
  }, [token]);

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

  return (
    <div className="p-6">
      {/* Loading Modals */}
      <LoadingModal
        isOpen={isSaving}
        message={
          selectedBarangay ? "Updating Barangay..." : "Creating Barangay..."
        }
      />
      <LoadingModal isOpen={isDeleting} message="Deleting Barangay..." />
      <h1 className="text-2xl font-bold mb-4 text-black">Barangays</h1>

      <button
        onClick={() => {
          setIsModalOpen(true);
          setSelectedBarangay(null);
          setFormData({ brgy_name: "", city: "" });
        }}
        className="btn btn-primary mb-4"
      >
        Add New Barangay
      </button>

      {errors.length > 0 && (
        <div className="alert alert-error">
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table-auto w-full text-sm border-collapse mt-4 text-black">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Barangay Name</th>
              <th className="px-4 py-2 text-left">City</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {barangays.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-2 text-center">
                  No Barangays available.
                </td>
              </tr>
            ) : (
              barangays.map((barangay) => (
                <tr key={barangay.id} className="border-b hover:bg-slate-100">
                  <td className="px-4 py-2">{barangay.brgy_name || "N/A"}</td>
                  <td className="px-4 py-2">{barangay.city || "N/A"}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleEdit(barangay)}
                      className="btn btn-primary btn-sm mr-2"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(barangay)}
                      className="btn btn-error btn-sm"
                    >
                      ❌ Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div
          className={`modal modal-open z-50 ${
            isSaving ? "pointer-events-none" : ""
          }`}
        >
          <div className="modal-box relative">
            <h2 className="text-xl font-semibold mb-4">
              {selectedBarangay ? "Edit Barangay" : "Add Barangay"}
            </h2>
            <form onSubmit={handleSave}>
              <label className="form-control w-full">
                <span className="label-text">Barangay Name</span>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={formData.brgy_name}
                  onChange={(e) =>
                    setFormData({ ...formData, brgy_name: e.target.value })
                  }
                  required
                />
                {errors.brgy_name && (
                  <p className="text-error">{errors.brgy_name[0]}</p>
                )}
              </label>
              <label className="form-control w-full mt-4">
                <span className="label-text">City</span>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  required
                />
                {errors.city && <p className="text-error">{errors.city[0]}</p>}
              </label>
              <div className="modal-action">
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

      {isDeleteModalOpen && (
        <div
          className={`modal modal-open z-50 ${
            isSaving ? "pointer-events-none" : ""
          }`}
        >
          <div className="modal-box relative">
            <h3 className="font-bold text-lg">Confirm Delete</h3>
            <p className="py-4">
              Are you sure you want to delete {barangayToDelete?.brgy_name}?
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
    </div>
  );
}
