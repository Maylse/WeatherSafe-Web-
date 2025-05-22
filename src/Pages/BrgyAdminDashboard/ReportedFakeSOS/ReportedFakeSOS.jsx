import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../Context/AppContext";
import axios from "axios";

const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

export default function ReportedFakeSOS() {
  const { user, token } = useContext(AppContext);
  const [reportedFakeSOS, setReportedFakeSOS] = useState([]);
  const [errors, setErrors] = useState([]);

  async function getReportedFakeReports() {
    try {
      const response = await axios.get(`${serverUrl}/api/reportedFakeSOS`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Correct key based on your JSON structure
      setReportedFakeSOS(response.data.reportedFakeSOS || []);
      setErrors([]);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setErrors(["Failed to fetch reports"]);
    }
  }

  useEffect(() => {
    getReportedFakeReports();
  }, []);

  return (
    <div>
      <h1>Reported Fake SOS</h1>
      {errors.length > 0 && <p style={{ color: "red" }}>{errors[0]}</p>}

      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>SOS ID</th>
            <th>User Name</th>
            <th>Reporter Contact No.</th>
            <th>SOS Created At</th>
          </tr>
        </thead>
        <tbody>
          {reportedFakeSOS.length > 0 ? (
            reportedFakeSOS.map((item) => (
              <tr key={item.id}>
                <td>{item.sos_id}</td>
                <td>{item.sos_data?.user?.name || "N/A"}</td>
                <td>{item.reporter_data?.contactno || "N/A"}</td>
                <td>{new Date(item.sos_data?.created_at).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No fake SOS reports found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
