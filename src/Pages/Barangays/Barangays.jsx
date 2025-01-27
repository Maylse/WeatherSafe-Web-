import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../Context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Barangays() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const { user, token } = useContext(AppContext);
  const [barangays, setBarangays] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    brgy_name: "",
    city: "",
  });

  // Fetch barangays from the API
  async function getBarangays() {
    const res = await fetch("/api/barangays", {
      method: "get",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();

    if (res.ok) {
      setBarangays(data || []); // Ensure we always set an array, even if the response is empty
    } else {
      setErrors(["Failed to fetch barangays"]);
    }
  }

  // Handle editing a barangay
  const handleEdit = (barangay) => {
    if (!barangay) return; // Safeguard in case the barangay is undefined
    setSelectedBarangay(barangay);
    setIsModalOpen(true);
    setFormData({
      brgy_name: barangay.brgy_name || "", // Safeguard in case brgy_name is missing
      city: barangay.city || "", // Safeguard in case city is missing
    });
  };

  // Handle saving the barangay (either create or update)
  const handleSave = async (e) => {
    e.preventDefault(); // Prevent the form from submitting normally

    // Extract the form data
    const { brgy_name, city } = formData;

    // Determine if we're updating an existing Barangay or creating a new one
    const method = selectedBarangay ? "PUT" : "POST"; // Use PUT if editing, POST if creating
    const endpoint = selectedBarangay
      ? `/api/barangays/${selectedBarangay.id}` // Update endpoint for editing
      : "/api/barangays"; // Endpoint for creating new barangay

    try {
      // Make the API request to either create or update the barangay
      const res = await fetch(endpoint, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brgy_name, // Barangay name
          city, // City associated with the barangay
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refetch the list of Barangays to keep the UI updated
        await getBarangays();

        // Close modal and reset form state after a successful save
        navigate("/barangays");
        setIsModalOpen(false);
        setSelectedBarangay(null); // Reset the selected barangay to null
        setFormData({
          brgy_name: "",
          city: "",
        });
      } else {
        setErrors(data.errors || ["Something went wrong!"]); // Handle API errors
      }
    } catch (error) {
      console.error("Error saving Barangay:", error);
      setErrors(["Something went wrong!"]); // Handle unexpected errors
    }
  };

  // Close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBarangay(null);
    setFormData({ brgy_name: "", city: "" });
  };

  // Handle deleting a barangay
  async function handleDelete(brgyId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this barangay?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/barangays/${brgyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setBarangays(barangays.filter((barangay) => barangay.id !== brgyId));
        alert("Barangay deleted successfully!");
      } else {
        console.error("Error deleting barangay:", data);
      }
    } catch (error) {
      console.error("An error occurred while deleting the barangay:", error);
    }
  }

  useEffect(() => {
    getBarangays();
  }, []);

  return (
    <div>
      <h1 className="title">Barangays</h1>

      {/* Add Barangay Button */}
      <button
        onClick={() => {
          setIsModalOpen(true);
          setSelectedBarangay(null);
          setFormData({ brgy_name: "", city: "" });
        }}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4"
      >
        Add New Barangay
      </button>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="text-red-500">
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Barangay table */}
      <table className="table-auto w-full text-sm border-collapse">
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
              <td colSpan="3" className="px-4 py-2 text-center">
                No Barangays available.
              </td>
            </tr>
          ) : (
            barangays.map((barangay) => (
              <tr key={barangay.id} className="border-b hover:bg-slate-100">
                <td className="px-4 py-2">{barangay.brgy_name || "N/A"}</td>
                <td className="px-4 py-2">{barangay.city || "N/A"}</td>
                <td className="px-4 py-2 flex space-x-2">
                  <button
                    onClick={() => handleEdit(barangay)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    📝
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(barangay.id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal for editing or creating barangay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-overlay flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              {selectedBarangay ? "Edit Barangay" : "Add Barangay"}
            </h2>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Barangay Name
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full p-2 border rounded"
                  value={formData.brgy_name}
                  onChange={(e) =>
                    setFormData({ ...formData, brgy_name: e.target.value })
                  }
                />
                {errors.brgy_name && (
                  <p className="error">{errors.brgy_name[0]}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">City</label>
                <input
                  type="text"
                  className="mt-1 block w-full p-2 border rounded"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
                {errors.city && <p className="error">{errors.city[0]}</p>}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
