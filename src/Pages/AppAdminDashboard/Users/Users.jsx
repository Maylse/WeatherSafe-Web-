import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";
import axios from "axios";

const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

export default function Users() {
  const { user, token } = useContext(AppContext);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
  const navigate = useNavigate();
  // Filter states
  const [filters, setFilters] = useState({
    userType: "",
    barangay: "",
    status: "",
  });

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    status: "",
    password: "",
    password_confirmation: "",
  });
  const [editErrors, setEditErrors] = useState([]);

  // Add these state variables near your other state declarations
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Helper function to get barangay name
  const getBarangayName = (user) => {
    try {
      if (user.brgy_admin?.barangay?.brgy_name) {
        return user.brgy_admin.barangay.brgy_name;
      }
      if (user.brgy_user?.barangay?.brgy_name) {
        return user.brgy_user.barangay.brgy_name;
      }
      if (user.community_user?.barangay?.brgy_name) {
        return user.community_user.barangay.brgy_name;
      }
      return "N/A";
    } catch (error) {
      console.error("Error getting barangay name:", error);
      return "N/A";
    }
  };

  // Get unique values for filter dropdowns
  const uniqueUserTypes = [...new Set(allUsers.map((u) => u.userType))];
  const uniqueBarangays = [
    ...new Set(
      allUsers.map((u) => getBarangayName(u)).filter((b) => b !== "N/A")
    ),
  ];
  const uniqueStatuses = [...new Set(allUsers.map((u) => u.status))];

  async function getAllUsers() {
    try {
      setLoading(true);
      const response = await axios.get(`${serverUrl}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAllUsers(response.data.users || []);
      setFilteredUsers(response.data.users || []);
      setErrors([]);
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrors(["Failed to fetch users"]);
    } finally {
      setLoading(false);
    }
  }

  // Open edit modal and set the user to edit
  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      status: user.status,
      password: "",
      password_confirmation: "",
    });
    setEditModalOpen(true);
    setEditErrors([]);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit the edit form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.put(
        `${serverUrl}/api/users/${editingUser.id || editingUser.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the user in the local state
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id || u.id === editingUser.id
            ? response.data.user
            : u
        )
      );

      setEditModalOpen(false);
      setErrors([]);
    } catch (error) {
      console.error("Error updating user:", error);
      if (error.response && error.response.data.errors) {
        setEditErrors(Object.values(error.response.data.errors).flat());
      } else {
        setEditErrors(["Failed to update user"]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add this delete function
  const handleDeleteUser = async () => {
    try {
      setDeleteLoading(true);
      await axios.delete(`${serverUrl}/api/users/${userToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove the deleted user from state
      setAllUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
      setDeleteModalOpen(false);
      setErrors([]);
    } catch (error) {
      console.error("Error deleting user:", error);
      setErrors(["Failed to delete user"]);
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userType === "app_admin") {
      getAllUsers();
    } else {
      navigate("/");
    }
  }, [user]);

  // Apply filters whenever filters or allUsers change
  useEffect(() => {
    const filtered = allUsers.filter((user) => {
      return (
        (filters.userType === "" || user.userType === filters.userType) &&
        (filters.barangay === "" ||
          getBarangayName(user) === filters.barangay) &&
        (filters.status === "" || user.status === filters.status)
      );
    });
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters, allUsers]);

  // Update displayed users when filteredUsers or currentPage changes
  useEffect(() => {
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    setDisplayedUsers(filteredUsers.slice(indexOfFirstUser, indexOfLastUser));
  }, [filteredUsers, currentPage]);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      userType: "",
      barangay: "",
      status: "",
    });
  };

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
      <h1 className="text-2xl font-bold mb-6">Users Management</h1>
      {/* Edit User Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box max-w-2xl w-full">
            <h3 className="text-xl font-semibold mb-4">Edit User</h3>

            {editErrors.length > 0 && (
              <div className="alert alert-error mb-4">
                {editErrors.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select
                    className="select select-bordered"
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Password</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Confirm Password</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn btn-ghost"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <LoadingModal
        isOpen={editModalOpen && loading}
        message="Updating user..."
      />
      {errors.length > 0 && (
        <div className="alert alert-error mb-6">
          {errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete user{" "}
              <span className="font-semibold">{userToDelete?.name}</span>? This
              action cannot be undone.
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="btn btn-ghost"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="btn btn-error"
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      // Update your LoadingModal to handle delete loading state
      <LoadingModal
        isOpen={(editModalOpen && loading) || deleteLoading}
        message={deleteLoading ? "Deleting user..." : "Updating user..."}
      />
      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* User Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Type
            </label>
            <select
              name="userType"
              value={filters.userType}
              onChange={handleFilterChange}
              className="select select-bordered w-full"
            >
              <option value="">All Types</option>
              {uniqueUserTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Barangay Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barangay
            </label>
            <select
              name="barangay"
              value={filters.barangay}
              onChange={handleFilterChange}
              className="select select-bordered w-full"
            >
              <option value="">All Barangays</option>
              {uniqueBarangays.map((brgy) => (
                <option key={brgy} value={brgy}>
                  {brgy}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="select select-bordered w-full"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button onClick={resetFilters} className="btn btn-outline w-full">
              Reset Filters
            </button>
          </div>
        </div>
      </div>
      {/* Users Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Barangay
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedUsers.length > 0 ? (
              displayedUsers.map((user) => (
                <tr key={user.id || user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={user.profile || "https://placehold.co/100"}
                          alt=""
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.userType === "app_admin"
                          ? "bg-purple-100 text-purple-800"
                          : user.userType === "barangay_admin"
                          ? "bg-blue-100 text-blue-800"
                          : user.userType === "barangay_user"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.userType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getBarangayName(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setUserToDelete(user);
                          setDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No users found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Simplified Centered Pagination */}
      <div className="flex justify-center items-center mt-6 space-x-2">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn btn-sm btn-outline"
        >
          &laquo; Prev
        </button>

        <span className="text-sm text-gray-600 mx-4">
          Page {currentPage} of {Math.ceil(filteredUsers.length / usersPerPage)}
        </span>

        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={
            currentPage === Math.ceil(filteredUsers.length / usersPerPage)
          }
          className="btn btn-sm btn-outline"
        >
          Next &raquo;
        </button>
      </div>
    </div>
  );
}
