import { useContext } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "../Context/AppContext";

export default function Layout() {
  const { user, token, setUser, setToken } = useContext(AppContext);
  const navigate = useNavigate();

  async function handleLogout(e) {
    e.preventDefault();

    const res = await fetch("/api/logout", {
      method: "post",
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
  return (
    <>
      <header>
        <nav>
          {user ? (
            <div className="flex items-center space-x-4">
              <p className="text-slate-400 text-xs">
                {" "}
                Welcome back {user.name}{" "}
              </p>
              <form onSubmit={handleLogout}>
                <button className="nav-link">Logout</button>
              </form>
            </div>
          ) : (
            <div className="space-x-4">
              <Link to="/register" className="nav-link">
                Register
              </Link>
              <Link to="/login" className="nav-link">
                Login
              </Link>
            </div>
          )}
        </nav>
      </header>

      <div className="flex h-screen">
        {user && (
          <aside className="w-64 bg-slate-800 text-slate-200 p-4">
            <ul>
              <li>
                <Link
                  to="/posts"
                  className="block px-4 py-2 rounded-md hover:bg-slate-700"
                >
                  Posts
                </Link>
              </li>
              <li>
                <Link
                  to="/brgy-admins"
                  className="block px-4 py-2 rounded-md hover:bg-slate-700"
                >
                  Barangay Admins
                </Link>
              </li>
              <li>
                <Link
                  to="/barangays"
                  className="block px-4 py-2 rounded-md hover:bg-slate-700"
                >
                  Barangay
                </Link>
              </li>
            </ul>
          </aside>
        )}

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </>
  );
}
