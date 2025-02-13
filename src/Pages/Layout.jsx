import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../Context/AppContext";
import AdminDashboard from "../Pages/AppAdminDashboard/AdminDashboard";
import BrgyAdmins from "../Pages/AppAdminDashboard/BrgyAdmins/BrgyAdmins";
import Barangays from "../Pages/AppAdminDashboard/Barangays/Barangays";
import Posts from "../Pages/AppAdminDashboard/Posts/Posts";
import BrgyAdminDashboard from "../Pages/BrgyAdminDashboard/BrgyAdminDashboard";
import BarangayUsers from "../Pages/BrgyAdminDashboard/BrgyUsers/BrgyUsers";
import CommunityUsers from "../Pages/BrgyAdminDashboard/CommunityUsers/CommunityUsers";
import Logo from "../Pages/Auth/logo.png";

export default function Layout() {
  const { user, token, setUser, setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [selected, setSelected] = useState("Dashboard");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!user && storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (!user) {
      navigate("/");
    }
  }, [user, navigate, setUser]);

  async function handleLogout(e) {
    e.preventDefault();
    await fetch("/api/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  const getMenuItems = () => {
    if (user?.userType === "app_admin") {
      return [
        { label: "Admin Dashboard", component: <AdminDashboard /> },
        { label: "Barangay Admins", component: <BrgyAdmins /> },
        { label: "Barangays", component: <Barangays /> },
        { label: "Posts", component: <Posts /> },
      ];
    } else if (user?.userType === "barangay_admin") {
      return [
        {
          label: "Barangay Admin Dashboard",
          component: <BrgyAdminDashboard />,
        },
        { label: "Barangay Users", component: <BarangayUsers /> },
        { label: "Community Users", component: <CommunityUsers /> },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex flex-col min-h-screen bg-base-100">
      {/* Header */}
      <header className="navbar bg-primary text-white shadow-md p-4 flex justify-end">
        {user && (
          <form onSubmit={handleLogout}>
            <button className="btn btn-error text-white">Log out</button>
          </form>
        )}
      </header>

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        {user && (
          <aside className="w-64 bg-base-300 p-4 shadow-lg">
            <div className="flex flex-col items-center w-full">
              {/* Logo */}
              <div className="mb-4">
                <img
                  src={Logo}
                  alt="WeatherSafe Logo"
                  className="w-32 h-auto"
                />
              </div>

              {/* Navigation Menu */}
              <ul className="menu w-full bg-base-300 rounded-box p-4 space-y-5">
                {menuItems.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => setSelected(item.label)}
                      className={`btn btn-block ${
                        selected === item.label ? "btn-primary" : "btn-ghost"
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {user && (
            <div className="card bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-4xl font-semibold text-black">
                Welcome, {user.name}
              </h2>
              <div className="mt-4">
                {menuItems.find((item) => item.label === selected)?.component}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
