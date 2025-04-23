import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../Context/AppContext";

export default function BarangayAdminDashboard({ setSelected }) {
  const { user, token } = useContext(AppContext);

  const [stats, setStats] = useState({
    barangayUsersCount: 0,
    communityUsersCount: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (user?.userType === "barangay_admin") {
      // Fixed user type check
      fetchAllStats();
    }
  }, [user, token]);

  async function fetchAllStats() {
    try {
      setStats((prev) => ({ ...prev, loading: true, error: null }));

      const [barangayUsersCount, communityUsersCount] = await Promise.all([
        fetchCount("api/barangay-user", "barangay_users"),
        fetchCount("api/community-user", "community_users"),
      ]);

      setStats({
        barangayUsersCount,
        communityUsersCount,
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
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data[dataKey]?.length || 0;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return 0;
    }
  }

  const handleCardClick = (componentName) => {
    setSelected(componentName);
  };

  if (stats.loading) {
    return <div className="p-6">Loading dashboard data...</div>;
  }

  if (stats.error) {
    return (
      <div className="p-6">
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
      <h1 className="text-2xl font-bold mb-6 text-black">Brgy Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Barangay Users Card */}
        <div
          className="card bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleCardClick("Barangay Users")} // Matches menuItems label
        >
          <h2 className="text-xl font-semibold mb-2 text-black">Total Barangay Users</h2>
          <p className="text-3xl font-bold text-primary">
            {stats.barangayUsersCount}
          </p>
          <p className="text-sm text-black mt-2">
            Click to view all barangay users
          </p>
        </div>

        {/* Community Users Card */}
        <div
          className="card bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleCardClick("Community Users")} // Matches menuItems label
        >
          <h2 className="text-xl font-semibold mb-2 text-black">Total Community Users</h2>
          <p className="text-3xl font-bold text-primary">
            {stats.communityUsersCount}
          </p>
          <p className="text-sm text-black mt-2">
            Click to view all community users
          </p>
        </div>
      </div>
    </div>
  );
}
