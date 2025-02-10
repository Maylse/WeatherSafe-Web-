import { useContext, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "../Context/AppContext";
import logo from "./Auth/logo.png";

export default function Layout() {
  const { user, token, setUser, setToken } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  async function handleLogout(e) {
    e.preventDefault();

    const res = await fetch("/api/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log(data);

    if (res.ok) {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      navigate("/");
    }
  }

  // Define navigation based on userType
  const renderSidebar = () => {
    if (!user) return null;

    switch (user.userType) {
      case "app_admin":
        return (
          <ul className="space-y-4">
            <li>
              <Link to="/AppAdminDashboard/posts/" className="block px-4 py-2 rounded hover:bg-blue-700 transition">
                Posts
              </Link>
            </li>
            <li>
              <Link to="/AppAdminDashboard/brgy-admins/" className="block px-4 py-2 rounded hover:bg-blue-700 transition">
                Barangay Admins
              </Link>
            </li>
            <li>
              <Link to="/AppAdminDashboard/barangays/" className="block px-4 py-2 rounded hover:bg-blue-700 transition">
                Barangay
              </Link>
            </li>
          </ul>
        );
      case "brgy-admin":
        return (
          <ul className="space-y-4">
            <li>
              <Link to="/BrgyAdminDashboard/updates/" className="block px-4 py-2 rounded hover:bg-blue-700 transition">
                Updates
              </Link>
            </li>
            <li>
              <Link to="/BrgyAdminDashboard/brgy-users/" className="block px-4 py-2 rounded hover:bg-blue-700 transition">
                Barangay Users
              </Link>
            </li>
            <li>
              <Link to="/BrgyAdminDashboard/community-users/" className="block px-4 py-2 rounded hover:bg-blue-700 transition">
                Community Users
              </Link>
            </li>
          </ul>
        );
      case "brgy_user":
        return (
          <ul className="space-y-4">
            <li>
              <Link to="/BrgyAdminDashboard/updates/" className="block px-4 py-2 rounded hover:bg-blue-700 transition">
                Updates
              </Link>
            </li>
            <li>
              <Link to="/BrgyAdminDashboard/community-users/" className="block px-4 py-2 rounded hover:bg-blue-700 transition">
                Community Users
              </Link>
            </li>
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-4 text-white">
        <div></div>
        {user && (
          <div className="flex items-center space-x-4">
            <p className="text-white text-xs">Welcome back {user.name}</p>
            <form onSubmit={handleLogout}>
              <button className="nav-link">Logout</button>
            </form>
          </div>
        )}
      </header>

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        {user && (
          <aside className="w-64 bg-blue-900 text-white p-4 pt-10">
            <div className="mb-6">
              <img src={logo} alt="WeatherSafe Logo" className="mx-auto w-32 mb-6" />
            </div>
            {renderSidebar()}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
