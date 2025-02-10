import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";

export default function BarangayUsers() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { token } = useContext(AppContext);
  const [barangayUsers, setBarangayUsers] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    barangay: "",
    name: "",
    password: "",
    password_confirmation: "",
  });

  async function getBarangayUsers() {
    try {
      const res = await fetch("/api/barangay-user", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        setBarangayUsers(data || []);
      } else {
        setErrors([data.message || "Failed to load Barangay Users"]);
      }
    } catch (error) {
      setErrors(["Failed to fetch Barangay Users"]);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setFormData({
      email: user.email || "",
      barangay: user.barangay || "",
      name: user.name || "",
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const { email, barangay, name, password, password_confirmation } = formData;
    const method = selectedUser ? "PUT" : "POST";
    const endpoint = selectedUser
      ? `/api/barangay-user/${selectedUser.id}`
      : "/api/barangay-user";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, barangay, name, password, password_confirmation }),
      });
      const data = await res.json();

      if (res.ok) {
        await getBarangayUsers();
        setIsModalOpen(false);
        setSelectedUser(null);
        setFormData({ email: "", barangay: "", name: "", password: "", password_confirmation: "" });
      } else {
        setErrors(data.errors || ["Something went wrong!"]);
      }
    } catch (error) {
      setErrors(["Something went wrong!"]);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/barangay-user/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setBarangayUsers(barangayUsers.filter((user) => user.id !== userId));
        alert("Barangay User deleted successfully!");
      } else {
        setErrors(["Failed to delete user"]);
      }
    } catch (error) {
      setErrors(["An error occurred while deleting the user."]);
    }
  };

  useEffect(() => {
    getBarangayUsers();
  }, []);

  return (
    <div>
      <h1 className="title">Barangay Users</h1>
      <button
        onClick={() => {
          setIsModalOpen(true);
          setSelectedUser(null);
          setFormData({ email: "", barangay: "", name: "", password: "", password_confirmation: "" });
        }}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4"
      >
        Add New Barangay User
      </button>

      {errors.length > 0 && (
        <div className="text-red-500">
          <ul>{errors.map((error, index) => <li key={index}>{error}</li>)}</ul>
        </div>
      )}

      <table className="table-auto w-full text-sm border-collapse mt-4">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Barangay</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="4" className="px-4 py-2 text-center">Loading...</td></tr>
          ) : barangayUsers.length === 0 ? (
            <tr><td colSpan="4" className="px-4 py-2 text-center">No Barangay Users available.</td></tr>
          ) : (
            barangayUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-slate-100">
                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.barangay}</td>
                <td className="px-4 py-2 flex space-x-2">
                  <button onClick={() => handleEdit(user)} className="text-blue-500 hover:text-blue-700">📝 Edit</button>
                  <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700">❌ Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
