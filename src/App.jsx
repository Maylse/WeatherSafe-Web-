import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Layout from "./Pages/Layout";
import Home from "./Pages/Home";
import Register from "./Pages/Auth/Register";
import Login from "./Pages/Auth/Login";
import { useContext } from "react";
import { AppContext } from "./Context/AppContext";
import Create from "./Pages/Posts/Create";
import Show from "./Pages/Posts/Show";
import Update from "./Pages/Posts/Update";

export default function App() {
  const { user } = useContext(AppContext);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />

          <Route path="/register" element={user ? <Home /> : <Register />} />
          <Route path="/login" element={user ? <Home /> : <Login />} />
          <Route path="/create" element={user ? <Create /> : <Login />} />

          <Route path="/posts/:id" element={<Show />} />
          <Route
            path="/posts/update/:id"
            element={user ? <Update /> : <Login />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
