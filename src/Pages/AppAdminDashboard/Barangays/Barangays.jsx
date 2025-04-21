import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../Context/AppContext";
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_BASE_URL;
export default function Barangays() {
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

  async function getBarangays() {
    const res = await fetch(`${apiUrl}/api/barangays`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();

    if (res.ok) {
      setBarangays(data.barangays || []);
    } else {
      setErrors(["Failed to fetch barangays"]);
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
    const method = selectedBarangay ? "PUT" : "POST";
    const endpoint = selectedBarangay
      ? `${apiUrl}/api/barangays/${selectedBarangay.id}`
      : `${apiUrl}/api/barangays`;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        await getBarangays();
        setIsModalOpen(false);
        setSelectedBarangay(null);
        setFormData({ brgy_name: "", city: "" });
      } else {
        setErrors(data.errors || ["Something went wrong!"]);
      }
    } catch (error) {
      setErrors(["Something went wrong!"]);
    }
  };

  const handleDelete = (barangay) => {
    setBarangayToDelete(barangay);
    setIsDeleteModalOpen(true);
  };

  async function confirmDelete() {
    if (!barangayToDelete) return;

    try {
      const res = await fetch(
        `${apiUrl}/api/barangays/${barangayToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json(); // Parse the JSON response

      if (res.ok) {
        // ✅ Remove the barangay from the list
        setBarangays(
          barangays.filter((barangay) => barangay.id !== barangayToDelete.id)
        );
        setIsDeleteModalOpen(false);
        console.log(data.message); // Debugging: Ensure successful message logs
      } else {
        console.error(
          "Error deleting barangay:",
          data.message || "Unknown error"
        );
      }
    } catch (error) {
      console.error("An error occurred while deleting a barangay:", error);
    }
  }

  useEffect(() => {
    getBarangays();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Barangays</h1>

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
        <table className="table-auto w-full text-sm border-collapse mt-4">
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
        <div className="modal modal-open">
          <div className="modal-box">
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
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
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
