import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../Context/AppContext";
import logo from "../../assets/logo.png";
import { getToken } from "firebase/messaging";
import { messaging } from "../../firebase";
import axios from "axios";

export default function Login() {
  const { setToken, setUser } = useContext(AppContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

  async function requestFcmToken() {
    try {
      const fcmToken = await getToken(messaging, {
        vapidKey:
          "BE53qXL30ywUtx63VkQZVgt37Bk3eaNdB6K6WQ3T70cBQgKx89Gcs2gv-x1T5Kya6QXFCuFy_-rcM0rVUu5HgCg",
      });
      return fcmToken || null;
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

      const response = await axios.post(
        `${serverUrl}/api/login`,
        {
          email: formData.email,
          password: formData.password,
          fcm_token: fcmToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          withCredentials: false,
        }
      );

      const { data } = response;
      console.log("API Response:", data);

      // First check if the response contains errors
      if (data.errors) {
        console.log("Found errors in response:", data.errors);
        setErrors(data.errors);
        setIsLoading(false);
        return; // Exit the function early
      }

      // Then proceed with success handling
      if (data.user) {
        const allowedUserTypes = ["app_admin", "barangay_admin"];

        if (data.user.status === "INACTIVE") {
          setModalMessage(
            "Your account has been deactivated. Please contact support."
          );
          setShowModal(true);
          clearAuthData();
        } else if (!allowedUserTypes.includes(data.user.userType)) {
          setModalMessage("This account type cannot access the system.");
          setShowModal(true);
          clearAuthData();
        } else {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          setToken(data.token);
          setUser(data.user);
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response) {
        // Handle HTTP error statuses
        if (error.response.data?.errors) {
          setErrors(error.response.data.errors);
        } else if (
          error.response.status === 401 ||
          error.response.status === 403
        ) {
          setErrors({
            email: ["The provided credentials are incorrect."],
          });
        }
      } else {
        setModalMessage(
          "Network error. Please check your connection and try again."
        );
        setShowModal(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  return (
    <div className="login-page flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-400 to-blue-600">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
            <p className="text-lg font-medium">Logging in...</p>
          </div>
        </div>
      )}

      <img src={logo} alt="WeatherSafe Logo" className="w-60 mx-auto" />
      <div className="w-full max-w-md p-8 bg-blue-600 shadow-lg mt-5 rounded-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-50">Login</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Field */}
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
              className={`input input-bordered w-full ${
                errors.email ? "input-error" : "bg-gray-100 text-gray-800"
              }`}
            />
            {errors.email && (
              <p className="text-red-300 text-sm mt-1">{errors.email[0]}</p>
            )}
          </div>

          {/* Password Field */}
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
              className={`input input-bordered w-full ${
                errors.password ? "input-error" : "bg-gray-100 text-gray-800"
              }`}
            />
            {errors.password && (
              <p className="text-red-300 text-sm mt-1">{errors.password[0]}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-full text-gray-100 text-sm"
            disabled={isLoading}
          >
            Login
          </button>
        </form>
      </div>

      {/* Error/Status Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Login Error</h3>
            <p className="py-4">{modalMessage}</p>
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
  );
}
