import { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "/src/Context/AppContext";
import { useNavigate } from "react-router-dom";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api";
import axios from "axios";
const serverUrl = import.meta.env.VITE_APP_SERVER_URL;

const containerStyle = {
  width: "100%",
  height: "400px",
};

export default function Sitio() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSitio, setSelectedSitio] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sitioToDelete, setSitioToDelete] = useState(null);
  const { user, token } = useContext(AppContext);
  const [sitios, setSitios] = useState([]);
  const [center, setCenter] = useState({
    lat: 10.378754, // Default center (Cebu coordinates)
    lng: 123.7638944,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    sitio_name: "",
    long: "",
    lat: "",
  });
  const mapRef = useRef(null);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenter({
            lat: latitude,
            lng: longitude,
          });
          setSelectedLocation({
            lat: latitude,
            lng: longitude,
          });
          setFormData((prev) => ({
            ...prev,
            lat: latitude.toString(),
            long: longitude.toString(),
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          setCenter({
            lat: 10.3157, // Default Cebu coordinates instead of Manila
            lng: 123.8854,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      setCenter({
        lat: 10.3157, // Default to Cebu coordinates
        lng: 123.8854,
      });
    }
  };

  // Fetch sitios
  async function getSitios() {
    try {
      const response = await axios.get(`${serverUrl}/api/brgySitios`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSitios(response.data.barangay_sitios || []);
    } catch (error) {
      console.error("Error fetching sitios:", error);
    }
  }

  const handleEdit = (sitio) => {
    setSelectedSitio(sitio);
    setFormData({
      sitio_name: sitio.sitio_name,
      long: sitio.long,
      lat: sitio.lat,
    });
    setSelectedLocation({
      lat: parseFloat(sitio.lat),
      lng: parseFloat(sitio.long),
    });
    setCenter({
      lat: parseFloat(sitio.lat),
      lng: parseFloat(sitio.long),
    });
    setIsModalOpen(true);
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setSelectedLocation({ lat, lng });
    setFormData({
      ...formData,
      lat: lat.toString(),
      long: lng.toString(),
    });
  };

  const handleMapLoad = (map) => {
    mapRef.current = map;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrors([]);

    if (!formData.sitio_name.trim() || !formData.long || !formData.lat) {
      setErrors(["Sitio name and coordinates cannot be empty."]);
      return;
    }

    try {
      const method = selectedSitio ? "put" : "post";
      const endpoint = selectedSitio
        ? `${serverUrl}}/api/brgySitios/${selectedSitio.id}`
        : `${serverUrl}/api/brgySitios`;

      const response = await axios[method](endpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state
      setSitios((prevSitios) =>
        selectedSitio
          ? prevSitios.map((sitio) =>
              sitio.id === selectedSitio.id
                ? response.data.barangay_sitio
                : sitio
            )
          : [response.data.barangay_sitio, ...prevSitios]
      );

      setIsModalOpen(false);
      setSelectedSitio(null);
      setFormData({ sitio_name: "", long: "", lat: "" });
      setSelectedLocation(null);
    } catch (error) {
      console.error("Error saving sitio:", error);
      if (error.response?.data?.errors) {
        setErrors(Object.values(error.response.data.errors).flat());
      } else {
        setErrors(["Something went wrong!"]);
      }
    }
  };

  const handleDelete = (sitio) => {
    setSitioToDelete(sitio);
    setIsDeleteModalOpen(true);
  };

  // Delete sitio
  const confirmDelete = async () => {
    if (!sitioToDelete) return;

    try {
      await axios.delete(`${serverUrl}/api/brgySitios/${sitioToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSitios(sitios.filter((sitio) => sitio.id !== sitioToDelete.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting sitio:", error);
    }
  };

  const handleAddNewSitio = () => {
    setIsModalOpen(true);
    setSelectedSitio(null);
    setFormData({
      sitio_name: "",
      long: "",
      lat: "",
    });
    setSelectedLocation(null);
    getUserLocation();
  };

  useEffect(() => {
    getSitios();
    getUserLocation();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sitios</h1>

      <button onClick={handleAddNewSitio} className="btn btn-primary mb-4">
        Add New Sitio
      </button>

      <div className="overflow-x-auto">
        <table className="table-auto w-full text-sm border-collapse mt-4">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Sitio Name</th>
              <th className="px-4 py-2 text-left">Longitude</th>
              <th className="px-4 py-2 text-left">Latitude</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sitios.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-2 text-center">
                  No sitios available.
                </td>
              </tr>
            ) : (
              sitios.map((sitio) => (
                <tr key={sitio.id} className="border-b hover:bg-slate-100">
                  <td className="px-4 py-2">{sitio.sitio_name}</td>
                  <td className="px-4 py-2">{sitio.long}</td>
                  <td className="px-4 py-2">{sitio.lat}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(sitio)}
                      className="btn btn-primary btn-sm mr-2"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(sitio)}
                      className="btn btn-error btn-sm"
                    >
                      ❌ Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h2 className="text-xl font-semibold mb-4">
              {selectedSitio ? "Edit Sitio" : "Add Sitio"}
            </h2>
            <form onSubmit={handleSave}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Sitio Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.sitio_name}
                  onChange={(e) =>
                    setFormData({ ...formData, sitio_name: e.target.value })
                  }
                  required
                />
                {errors.sitio_name && (
                  <p className="text-error">{errors.sitio_name[0]}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="label">
                  <span className="label-text">Select Location on Map</span>
                </label>
                <div className="h-96 rounded-lg overflow-hidden">
                  <LoadScript googleMapsApiKey="AIzaSyAzJLgjpVEgj5a-vC5FExOjygowRk05QJE">
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      center={center}
                      zoom={15}
                      onClick={handleMapClick}
                      onLoad={handleMapLoad}
                    >
                      {selectedLocation && (
                        <Marker position={selectedLocation} />
                      )}
                    </GoogleMap>
                  </LoadScript>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Click on the map to select the sitio location
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Latitude</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.lat}
                    readOnly
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Longitude</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.long}
                    readOnly
                  />
                </div>
              </div>

              {errors.length > 0 && (
                <div className="alert alert-error mb-4">
                  {errors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedLocation(null);
                  }}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Delete</h3>
            <p className="py-4">
              Are you sure you want to delete {sitioToDelete?.sitio_name}?
            </p>
            <div className="modal-action">
              <button className="btn btn-error" onClick={confirmDelete}>
                Yes, Delete
              </button>
              <button
                className="btn"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
