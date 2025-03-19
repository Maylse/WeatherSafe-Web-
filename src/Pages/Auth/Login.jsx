import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../../Context/AppContext";
import logo from "../../assets/logo.png";
import { getToken } from "firebase/messaging";
import { messaging } from "../../firebase"; // Ensure you export messaging in firebase.js

export default function Login() {
  const { setToken, setUser } = useContext(AppContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function requestFcmToken() {
    try {
      const fcmToken = await getToken(messaging, {
        vapidKey:
          "BE53qXL30ywUtx63VkQZVgt37Bk3eaNdB6K6WQ3T70cBQgKx89Gcs2gv-x1T5Kya6QXFCuFy_-rcM0rVUu5HgCg",
      });
      if (!fcmToken) {
        console.warn("No FCM token received.");
        return null;
      }
      return fcmToken;
    } catch (error) {
      console.error("Error retrieving FCM token:", error);
      return null;
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const fcmToken = await requestFcmToken();

      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ ...formData, fcm_token: fcmToken }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (data.errors) {
        setErrors(data.errors);
      } else if (data.user && data.user.status === "INACTIVE") {
        setShowModal(true);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      } else if (data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: ["Something went wrong. Please try again."] });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-page flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-400 to-blue-600">
      <img src={logo} alt="WeatherSafe Logo" className="w-60 mx-auto" />
      <div className="w-full max-w-md p-8 bg-blue-600 shadow-lg mt-5 rounded-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-50">Login</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-50">Email</span>
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="input input-bordered w-full bg-gray-100 text-gray-800"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email[0]}</p>
            )}
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-50">Password</span>
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              className="input input-bordered w-full bg-gray-100 text-gray-800 text-sm"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password[0]}</p>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full flex justify-center items-center text-gray-100 text-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Login"
            )}
          </button>
        </form>
        {errors.general && (
          <p className="text-red-500 text-sm mt-2">{errors.general[0]}</p>
        )}
        {showModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="text-lg font-bold">Account Inactive</h3>
              <p className="py-2">
                Your account has been deactivated. Please contact support.
              </p>
              <div className="modal-action">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
