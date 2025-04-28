import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../Context/AppContext";

import axios from "axios";

const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

export default function BarangayAdminDashboard({ setSelected }) {
  const { user, token } = useContext(AppContext); // include token
  const [stats, setStats] = useState({
    barangayUsersCount: 0,
    communityUsersCount: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (user?.userType === "barangay_admin") {
      fetchAllStats();
    }
  }, [user]);

  async function fetchAllStats() {
    try {
      setStats((prev) => ({ ...prev, loading: true, error: null }));

      // Set headers with Authorization
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Fetch all counts in parallel using Axios with token
      const [barangayUsersResponse, communityUsersResponse] = await Promise.all(
        [
          axios.get(`${serverUrl}/api/barangay-user`, config),
          axios.get(`${serverUrl}/api/community-user`, config),
        ]
      );

      setStats({
        barangayUsersCount:
          barangayUsersResponse.data.barangay_users?.length || 0,
        communityUsersCount:
          communityUsersResponse.data.community_users?.length || 0,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load dashboard statistics",
      }));
    }
  }

  const handleCardClick = (componentName) => {
    setSelected(componentName);
  };

  if (!user) {
    return null; // or show a loading spinner
  }

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (stats.loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Brgy Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card bg-white shadow-lg rounded-lg p-6">
              <div className="animate-pulse">
                <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 w-1/2 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Brgy Admin Dashboard</h1>
        <div className="alert alert-error shadow-lg">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{stats.error}</span>
            <button
              className="btn btn-sm btn-ghost ml-2"
              onClick={fetchAllStats}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Brgy Admin Dashboard</h1>
      <div className="bg-white shadow-md rounded-lg p-6 max-w-full mx-auto my-8">
        <h2 className="text-2xl font-bold mb-4">Subscription Details</h2>
        <div className="text-gray-700 mb-2">
          <strong>Started On:</strong> {formatDate(user.created_at)}
        </div>
        <div className="text-gray-700 mb-2">
          <strong>Ends On:</strong> {formatDate(user.subscription_end)}
        </div>
        <div
          className={`mt-4 text-sm font-semibold ${
            user.is_subscription_active ? "text-green-600" : "text-red-600"
          }`}
        >
          {user.is_subscription_active
            ? "Active Subscription"
            : "Subscription Inactive"}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Barangay Users Card */}
        <div
          className="card bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleCardClick("Barangay Users")}
        >
          <h2 className="text-xl font-semibold mb-2">Total Barangay Users</h2>
          <p className="text-3xl font-bold text-primary">
            {stats.barangayUsersCount}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Click to view all barangay users
          </p>
        </div>

        {/* Community Users Card */}
        <div
          className="card bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleCardClick("Community Users")}
        >
          <h2 className="text-xl font-semibold mb-2">Total Community Users</h2>
          <p className="text-3xl font-bold text-primary">
            {stats.communityUsersCount}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Click to view all community users
          </p>
        </div>
      </div>
    </div>
  );
}
