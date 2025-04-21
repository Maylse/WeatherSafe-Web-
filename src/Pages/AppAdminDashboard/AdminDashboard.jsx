import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../Context/AppContext";
import api from "../../../api";

export default function AdminDashboard({ setSelected }) {
  const { user } = useContext(AppContext);
  const [stats, setStats] = useState({
    barangays: 0,
    barangayAdmins: 0,
    posts: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (user?.userType === "app_admin") {
      fetchAllStats();
    }
  }, [user]);

  async function fetchAllStats() {
    try {
      setStats((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch all counts in parallel for better performance
      const [barangaysCount, barangayAdminsCount, postsCount] =
        await Promise.all([
          fetchCount("api/barangays", "barangays"),
          fetchCount("api/barangay-admins", "barangay_admins"),
          fetchCount("api/posts", "posts"),
        ]);

      setStats({
        barangays: barangaysCount,
        barangayAdmins: barangayAdminsCount,
        posts: postsCount,
        loading: false,
        error: null,
      });
    } catch (error) {
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load dashboard statistics",
      }));
      console.error("Error fetching stats:", error);
    }
  }

  async function fetchCount(endpoint, dataKey) {
    try {
      const response = await api.get(endpoint);

      // Axios wraps the response data in a data property
      const responseData = response.data;

      // Handle the count based on the endpoint's data structure
      if (responseData[dataKey] && Array.isArray(responseData[dataKey])) {
        return responseData[dataKey].length;
      }

      return 0;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return 0; // Return 0 if there's an error
    }
  }

  // ... rest of your component remains the same ...
  const handleCardClick = (componentName) => {
    setSelected(componentName);
  };

  if (stats.loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
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
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Barangays Card */}
        <div
          className="card bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleCardClick("Barangays")}
        >
          <h2 className="text-xl font-semibold mb-2">Total Barangays</h2>
          <p className="text-3xl font-bold text-primary">{stats.barangays}</p>
          <p className="text-sm text-gray-500 mt-2">
            Click to view all barangays
          </p>
        </div>

        {/* Barangay Admins Card */}
        <div
          className="card bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleCardClick("Barangay Admins")}
        >
          <h2 className="text-xl font-semibold mb-2">Barangay Admins</h2>
          <p className="text-3xl font-bold text-primary">
            {stats.barangayAdmins}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Click to view all barangay admins
          </p>
        </div>

        {/* Posts Card */}
        <div
          className="card bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleCardClick("Posts")}
        >
          <h2 className="text-xl font-semibold mb-2">Total Posts</h2>
          <p className="text-3xl font-bold text-primary">{stats.posts}</p>
          <p className="text-sm text-gray-500 mt-2">Click to view all posts</p>
        </div>
      </div>
    </div>
  );
}
