import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Layout from "./Pages/Layout";

import Register from "./Pages/Auth/Register";
import Login from "./Pages/Auth/Login";
import { useContext } from "react";
import { AppContext } from "./Context/AppContext";
import Posts from "./Pages/Posts/Posts";
import BrgyAdmins from "./Pages/BrgyAdmins/BrgyAdmins";
import Barangays from "./Pages/Barangays/Barangays";

export default function App() {
  const { user } = useContext(AppContext);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={user ? <Posts /> : <Login />} />
          <Route path="/register" element={user ? <Posts /> : <Register />} />
          <Route path="/login" element={user ? <Posts /> : <Login />} />
          {/* Register the Post component for the /posts route */}
          <Route path="/posts" element={user ? <Posts /> : <Login />} />
          <Route
            path="/brgy-admins"
            element={user ? <BrgyAdmins /> : <Login />}
          />
          <Route path="/barangays" element={user ? <Barangays /> : <Login />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
