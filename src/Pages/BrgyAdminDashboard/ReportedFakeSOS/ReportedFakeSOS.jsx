import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../Context/AppContext";
import axios from "axios";

const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

export default function ReportedFakeSOS() {
  const { user, token } = useContext(AppContext);
  const [reportedFakeSOS, setReportedFakeSOS] = useState([]);
  const [errors, setErrors] = useState([]);
  const [selectedSOS, setSelectedSOS] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function getReportedFakeReports() {
    try {
      const response = await axios.get(`${serverUrl}/api/reportedFakeSOS`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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

  const openModal = (sos) => {
    setSelectedSOS(sos);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedSOS(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Reported Fake SOS</h1>
      
      {errors.length > 0 && (
        <div className="alert alert-error mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errors[0]}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>SOS ID</th>
              <th>User Name</th>
              <th>Reporter Contact</th>
              <th>Date Reported</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reportedFakeSOS.length > 0 ? (
              reportedFakeSOS.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono">{item.sos_id.slice(-6)}</td>
                  <td>{item.sos_data?.user?.name || "N/A"}</td>
                  <td>{item.reporter_data?.contactno || "N/A"}</td>
                  <td>{new Date(item.sos_data?.created_at).toLocaleString()}</td>
                  <td>
                    <button 
                      onClick={() => openModal(item)}
                      className="btn btn-sm btn-primary"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  <div className="text-gray-500">No fake SOS reports found</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DaisyUI Modal */}
      <dialog open={isModalOpen} className="modal">
        <div className="modal-box max-w-2xl">
          <h3 className="font-bold text-2xl mb-4">SOS Report Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <div className="stat">
                <div className="stat-title">Status</div>
               <div className={`stat-value ${
                selectedSOS?.sos_data?.status === "PENDING" 
                    ? "text-warning" 
                    : selectedSOS?.sos_data?.status === "REPORTED"
                    ? "text-error"
                    : "text-success"
                }`}>
                {selectedSOS?.sos_data?.status}
                </div>
              </div>
              
              <div className="stat">
                <div className="stat-title">Barangay</div>
                <div className="stat-value text-lg">
                  {selectedSOS?.sos_data?.barangay?.brgy_name}
                </div>
              </div>
            </div>
            
            <div>
              <div className="stat">
                <div className="stat-title">Coordinates</div>
                <div className="stat-value text-lg">
                  {selectedSOS?.sos_data?.lat}, {selectedSOS?.sos_data?.long}
                </div>
              </div>
              
              <div className="stat">
                <div className="stat-title">Date Created</div>
                <div className="stat-value text-lg">
                  {new Date(selectedSOS?.sos_data?.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          
          <div className="card bg-base-100 shadow mb-4">
            <div className="card-body">
              <h4 className="card-title">Message</h4>
              <p>{selectedSOS?.sos_data?.message}</p>
            </div>
          </div>
          
          <div className="card bg-base-100 shadow mb-4">
            <div className="card-body">
              <h4 className="card-title">Reporter Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Name:</strong> {selectedSOS?.reporter_data?.firstname} {selectedSOS?.reporter_data?.lastname}</p>
                  <p><strong>Contact:</strong> {selectedSOS?.reporter_data?.contactno}</p>
                </div>
                <div>
                  <p><strong>Occupation:</strong> {selectedSOS?.reporter_data?.occupation}</p>
                  <p><strong>Age:</strong> {selectedSOS?.reporter_data?.age}</p>
                </div>
              </div>
            </div>
          </div>
          
          {selectedSOS?.sos_data?.img_url && (
            <div className="card bg-base-100 shadow mb-4">
              <div className="card-body">
                <h4 className="card-title">SOS Image</h4>
                <img 
                  src={selectedSOS.sos_data.img_url} 
                  alt="SOS" 
                  className="rounded-lg w-full max-h-64 object-contain"
                />
              </div>
            </div>
          )}
          
          <div className="modal-action">
            <button onClick={closeModal} className="btn">
              Close
            </button>
          </div>
        </div>
        
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeModal}>close</button>
        </form>
      </dialog>
    </div>
  );
}