import { Link } from "react-router-dom";
import logo from "../Pages/Auth/logo.png";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header>
        <img src={logo} alt="WeatherSafe Logo" className="logo" />
        <h1>Welcome to WeatherSafe</h1>
        <p>Your reliable weather alert and community safety system.</p>
        <Link to="/login" className="btn">
          Login
        </Link>
      </header>
    </div>
  );
}
