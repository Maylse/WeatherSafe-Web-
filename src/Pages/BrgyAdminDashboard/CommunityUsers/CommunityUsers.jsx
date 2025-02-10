import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";

export default function CommunityUsers() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { token } = useContext(AppContext);
  const [communityUsers, setCommunityUsers] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    middlename: "",
    barangay: "",
    birthplace: "",
    sex: "",
    ethnicity: "",
    nationality: "",
    contactno: "",
    altcontactno: "",
    occupation: "",
  });

  async function getCommunityUsers() {
    try {
      const res = await fetch("/api/community-user", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        setCommunityUsers(data || []);
      } else {
        setErrors([data.message || "Failed to load Community Users"]);
      }
    } catch (error) {
      setErrors(["Failed to fetch Community Users"]);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setFormData({
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      middlename: user.middlename || "",
      barangay: user.barangay || "",
      birthplace: user.birthplace || "",
      sex: user.sex || "",
      ethnicity: user.ethnicity || "",
      nationality: user.nationality || "",
      contactno: user.contactno || "",
      altcontactno: user.altcontactno || "",
      occupation: user.occupation || "",
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const {
      firstname,
      lastname,
      middlename,
      barangay,
      birthplace,
      sex,
      ethnicity,
      nationality,
      contactno,
      altcontactno,
      occupation,
    } = formData;

    const method = selectedUser ? "PUT" : "POST";
    const endpoint = selectedUser
      ? `/api/community-user/${selectedUser.id}`
      : "/api/community-user";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstname,
          lastname,
          middlename,
          barangay,
          birthplace,
          sex,
          ethnicity,
          nationality,
          contactno,
          altcontactno,
          occupation,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        await getCommunityUsers();
        setIsModalOpen(false);
        setSelectedUser(null);
        setFormData({
          firstname: "",
          lastname: "",
          middlename: "",
          barangay: "",
          birthplace: "",
          sex: "",
          ethnicity: "",
          nationality: "",
          contactno: "",
          altcontactno: "",
          occupation: "",
        });
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
      const res = await fetch(`/api/community-user/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setCommunityUsers(communityUsers.filter((user) => user.id !== userId));
        alert("Community User deleted successfully!");
      } else {
        setErrors(["Failed to delete user"]);
      }
    } catch (error) {
      setErrors(["An error occurred while deleting the user."]);
    }
  };

  useEffect(() => {
    getCommunityUsers();
  }, []);

  return (
    <div>
      <h1 className="title">Community Users</h1>
      <button
        onClick={() => {
          setIsModalOpen(true);
          setSelectedUser(null);
          setFormData({
            firstname: "",
            lastname: "",
            middlename: "",
            barangay: "",
            birthplace: "",
            sex: "",
            ethnicity: "",
            nationality: "",
            contactno: "",
            altcontactno: "",
            occupation: "",
          });
        }}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4"
      >
        Add New Community User
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
            <th className="px-4 py-2 text-left">Barangay</th>
            <th className="px-4 py-2 text-left">Contact No.</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="4" className="px-4 py-2 text-center">Loading...</td></tr>
          ) : communityUsers.length === 0 ? (
            <tr><td colSpan="4" className="px-4 py-2 text-center">No Community Users available.</td></tr>
          ) : (
            communityUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-slate-100">
                <td className="px-4 py-2">{user.firstname} {user.lastname}</td>
                <td className="px-4 py-2">{user.barangay}</td>
                <td className="px-4 py-2">{user.contactno}</td>
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
