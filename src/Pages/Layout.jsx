import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../Context/AppContext";
import { Bell } from "lucide-react";
import AdminDashboard from "../Pages/AppAdminDashboard/AdminDashboard";
import BrgyAdmins from "../Pages/AppAdminDashboard/BrgyAdmins/BrgyAdmins";
import Barangays from "../Pages/AppAdminDashboard/Barangays/Barangays";
import Posts from "../Pages/AppAdminDashboard/Posts/Posts";
import BrgyAdminDashboard from "../Pages/BrgyAdminDashboard/BrgyAdminDashboard";
import BarangayUsers from "../Pages/BrgyAdminDashboard/BrgyUsers/BrgyUsers";
import CommunityUsers from "../Pages/BrgyAdminDashboard/CommunityUsers/CommunityUsers";
import Logo from "../assets/logo.png";
import Profile from "./Profile";
import Sitio from "./BrgyAdminDashboard/Sitios/Sitio";

const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

import axios from "axios";
import Announcements from "./BrgyAdminDashboard/Announcements/Announcements";
import Users from "./AppAdminDashboard/Users/Users";
import ReportedFakeSOS from "./BrgyAdminDashboard/ReportedFakeSOS/ReportedFakeSOS";

export default function Layout() {
  const { user, token, setUser, setToken } = useContext(AppContext);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const [selected, setSelected] = useState(
    user?.userType === "app_admin"
      ? "Admin Dashboard"
      : "Barangay Admin Dashboard"
  );
  const notificationsRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!user && storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (!user) {
      navigate("/");
    }
  }, [user, navigate, setUser]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function fetchNotifications() {
    try {
      const response = await axios.get(`${serverUrl}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }

  async function markAllAsRead() {
    try {
      await axios.post(
        `${serverUrl}/api/notifications/mark-all-as-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }

  async function handleLogout(e) {
    e.preventDefault();
    setIsLoggingOut(true); // Show loading modal

    try {
      await axios.post(
        `${serverUrl}/api/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsLoggingOut(false); // Hide loading modal
    }
  }

  const getMenuItems = () => {
    if (user?.userType === "app_admin") {
      return [
        {
          label: "Admin Dashboard",
          component: <AdminDashboard setSelected={setSelected} />,
        },
        { label: "Barangay Admins", component: <BrgyAdmins /> },
        { label: "Barangays", component: <Barangays /> },
        { label: "Posts", component: <Posts /> },
        { label: "Users", component: <Users /> },
      ];
    } else if (user?.userType === "barangay_admin") {
      return [
        {
          label: "Barangay Admin Dashboard",
          component: <BrgyAdminDashboard setSelected={setSelected} />,
        },
        { label: "Barangay Users", component: <BarangayUsers /> },
        { label: "Community Users", component: <CommunityUsers /> },
        { label: "Sitios", component: <Sitio /> },
        { label: "Announcements", component: <Announcements /> },
         { label: "Fake Reports", component: <ReportedFakeSOS /> },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();
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
    <div className="flex flex-col min-h-screen bg-base-100">
      {/* Loading Modal */}
      <LoadingModal isOpen={isLoggingOut} message="Logging out..." />
      {/* Header */}
      <header className="navbar bg-primary text-white shadow-md p-4 flex justify-between items-center">
        {/* Logo */}
        <div>
          <img src={Logo} alt="App Logo" className="w-32 h-auto" />
        </div>

        {/* Notifications & Logout */}
        <div className="flex items-center space-x-6">
          {/* Notification Bell */}
          <div
            className="relative cursor-pointer"
            onClick={() => {
              setShowNotifications(!showNotifications);
              markAllAsRead(); // Mark all notifications as read when the bell is clicked
            }}
            ref={notificationsRef}
          >
            <Bell className="w-8 h-8" />
            {notifications.filter((notif) => !notif.is_read).length > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {notifications.filter((notif) => !notif.is_read).length}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-16 mt-2 w-80 bg-white shadow-lg rounded-lg z-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-black">
                  Notifications
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {" "}
                {/* Added max height and scroll */}
                {notifications.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {notifications.map((notif, index) => (
                      <li
                        key={index}
                        className={`p-4 ${
                          notif.is_read ? "bg-blue-50" : "bg-red-50"
                        }`}
                      >
                        <p className="text-sm text-gray-800">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500">
                      No new notifications
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Logout Button */}
          <form onSubmit={handleLogout}>
            <button className="btn btn-error text-black">Log out</button>
          </form>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        {user && (
          <aside className="w-64 bg-base-300 p-4 shadow-lg">
            <div className="flex flex-col items-center w-full">
              {/* Profile Section */}
              <div
                className="flex items-center space-x-4 p-3 cursor-pointer hover:bg-base-200 rounded-lg w-full"
                onClick={() => setSelected("Profile")}
              >
                <img
                  src={user.profile || "https://placehold.co/100"}
                  alt="User Profile"
                  className="w-12 h-12 rounded-full border border-gray-800"
                />
                <div>
                  <p className="text-lg font-semibold">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
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
                {selected === "Profile" ? (
                  <Profile />
                ) : (
                  menuItems.find((item) => item.label === selected)?.component
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
