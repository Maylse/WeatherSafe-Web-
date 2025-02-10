import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Layout from "./Pages/Layout";
import Register from "./Pages/Auth/Register";
import Login from "./Pages/Auth/Login";
import { useContext } from "react";
import { AppContext } from "./Context/AppContext";
import Posts from "./Pages/AppAdminDashboard/Posts/Posts";
import BrgyAdmins from "./Pages/AppAdminDashboard/BrgyAdmins/BrgyAdmins";
import Barangays from "./Pages/AppAdminDashboard/Barangays/Barangays";
import Updates from "./Pages/BrgyAdminDashboard/Updates/Updates"; // Temporarily disabled
import BrgyUsers from "./Pages/BrgyAdminDashboard/BrgyUsers/BrgyUsers";
import CommunityUsers from "./Pages/BrgyAdminDashboard/CommunityUsers/CommunityUsers"; // Temporarily disabled

export default function App() {
  const { user } = useContext(AppContext);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={user ? <Posts /> : <Login />} />
          <Route path="/register" element={user ? <Posts /> : <Register />} />
          <Route path="/login" element={user ? <Posts /> : <Login />} />
          <Route path="/AppAdminDashboard/posts" element={user ? <Posts /> : <Login />} />
          <Route path="/AppAdminDashboard/brgy-admins" element={user ? <BrgyAdmins /> : <Login />} />
          <Route path="/AppAdminDashboard/barangays" element={user ? <Barangays /> : <Login />} />
          <Route path="/BrgyAdminDashboard/updates" element={user ? <Updates /> : <Login />} />
          <Route path="/BrgyAdminDashboard/brgy-users" element={user ? <BrgyUsers /> : <Login />} />
          <Route path="/BrgyAdminDashboard/community-users" element={user ? <CommunityUsers /> : <Login />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
