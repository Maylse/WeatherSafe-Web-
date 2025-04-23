import axios from "axios";
import { createContext, useEffect, useState } from "react";

const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

export const AppContext = createContext();

export default function AppProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  async function getUser() {
    if (!token) return;

    try {
      const response = await axios.get(`${serverUrl}/api/user`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setUser(response.data); // Ensure response.data contains userType
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
      // Handle unauthorized (401) by clearing token
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        setToken(null);
      }
    }
  }

  useEffect(() => {
    getUser();
  }, [token]);

  return (
    <AppContext.Provider value={{ token, setToken, user, setUser }}>
      {children}
    </AppContext.Provider>
  );
}
