import { useContext, useEffect, useState } from "react";
import { AppContext } from "/src/Context/AppContext";
import { useNavigate } from "react-router-dom";
import "./Updates.css";

export default function Updates() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const { user, token } = useContext(AppContext);
  const [updates, setUpdates] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    headline: "",
    barangay: "",
    date: "",
    time: "",
    author: "",
    type: "",
  });

  async function getUpdates() {
    const res = await fetch("/api/updates", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();

    if (res.ok) {
      setUpdates(data.updates);
    }
  }

  const handleEdit = (update) => {
    setSelectedUpdate(update); // Set the selected update for the modal
    setIsModalOpen(true); // Open the modal
    setFormData({
      headline: update.headline,
      barangay: update.barangay,
      date: update.date,
      time: update.time,
      author: update.author,
      type: update.type,
    }); // Set the form data with selected update data
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const { headline, barangay, date, time, author, type } = formData;

    const method = selectedUpdate ? "PUT" : "POST"; // If editing, use PUT, else use POST
    const endpoint = selectedUpdate
      ? `/api/updates/${selectedUpdate.id}`
      : "/api/updates"; // Different endpoint for editing vs creating

    try {
      const res = await fetch(endpoint, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ headline, barangay, date, time, author, type }),
      });

      const data = await res.json();

      if (res.ok) {
        if (selectedUpdate) {
          setUpdates(
            updates.map((update) =>
              update.id === selectedUpdate.id ? data.update : update
            )
          );
        } else {
          setUpdates([data.update, ...updates]);
        }

        navigate("/updates"); // Navigate back to updates list
        setIsModalOpen(false); // Close the modal
        setSelectedUpdate(null); // Clear selected update
        setFormData({
          headline: "",
          barangay: "",
          date: "",
          time: "",
          author: "",
          type: "",
        }); // Reset form data
      } else {
        setErrors(data.errors); // Set validation errors
      }
    } catch (error) {
      console.error("Error saving update:", error);
      setErrors(["Something went wrong!"]);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
    setSelectedUpdate(null); // Clear the selected update
    setFormData({
      headline: "",
      barangay: "",
      date: "",
      time: "",
      author: "",
      type: "",
    }); // Reset form data
  };

  async function handleDelete(updateId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this update?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/updates/${updateId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setUpdates(updates.filter((update) => update.id !== updateId));
        alert("Update deleted successfully!");
      } else {
        console.error("Error deleting update:", data);
      }
    } catch (error) {
      console.error("An error occurred while deleting the update:", error);
    }
  }

  useEffect(() => {
    getUpdates();
  }, []);

  return (
    <div>
      <h1 className="title">Updates</h1>

      <button
        onClick={() => {
          setIsModalOpen(true);
          setSelectedUpdate(null);
          setFormData({
            headline: "",
            barangay: "",
            date: "",
            time: "",
            author: "",
            type: "",
          });
        }}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4"
      >
        Add New Update
      </button>

      <table className="table-auto w-full">
        <thead>
          <tr>
            <th>Headline</th>
            <th>Barangay</th>
            <th>Author</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {updates.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">
                No updates available.
              </td>
            </tr>
          ) : (
            updates.map((update) => (
              <tr key={update.id}>
                <td>{update.headline}</td>
                <td>{update.barangay}</td>
                <td>{update.author}</td>
                <td>{update.date}</td>
                <td className="actions">
                  <button
                    onClick={() => handleEdit(update)}
                    className="edit"
                    title="Edit"
                  >
                    📝 Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(update.id);
                    }}
                    className="delete"
                    title="Delete"
                  >
                    ❌ Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="fixed inset-0 bg-overlay flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              {selectedUpdate ? "Edit Update" : "Add Update"}
            </h2>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block text-sm font-medium">Headline</label>
                <input
                  type="text"
                  className="mt-1 block w-full p-2 border rounded"
                  value={formData.headline}
                  onChange={(e) =>
                    setFormData({ ...formData, headline: e.target.value })
                  }
                />
                {errors.headline && <p className="error">{errors.headline[0]}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Barangay</label>
                <input
                  type="text"
                  className="mt-1 block w-full p-2 border rounded"
                  value={formData.barangay}
                  onChange={(e) =>
                    setFormData({ ...formData, barangay: e.target.value })
                  }
                />
                {errors.barangay && <p className="error">{errors.barangay[0]}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Date</label>
                <input
                  type="date"
                  className="mt-1 block w-full p-2 border rounded"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Time</label>
                <input
                  type="time"
                  className="mt-1 block w-full p-2 border rounded"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Author</label>
                <input
                  type="text"
                  className="mt-1 block w-full p-2 border rounded"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Type</label>
                <input
                  type="text"
                  className="mt-1 block w-full p-2 border rounded"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-300 rounded text-black hover:bg-gray-400"
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
