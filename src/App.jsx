import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { requestNotificationPermission } from "./firebase"; // Import the function
import Login from "./Pages/Auth/Login";
import Layout from "./Pages/Layout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  useEffect(() => {
    // Register the Firebase Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
          return requestNotificationPermission();
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return (
    <BrowserRouter basename="/WeatherSafe-Web-">
      {/* Place ToastContainer here to make it globally accessible */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Layout />} />
      </Routes>
    </BrowserRouter>
  );
}
