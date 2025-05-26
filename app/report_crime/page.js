"use client";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then(mod => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then(mod => mod.Marker),
  { ssr: false }
);
import { Icon } from "leaflet";

const markerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function ReportCrimePage() {
  const [files, setFiles] = useState([]); // Multiple files
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.209 });
  const [manual, setManual] = useState(false);
  const [form, setForm] = useState({
    reporterType: "Victim",
    security: "None",
    crimeType: "Chain Snatching",
    description: "",
    date: "",
    time: "",
    address: "",
    suspectDescription: "",
    numSuspects: "",
    vehicleInfo: "",
    witnessInfo: "",
    reporterName: "",
    reporterPhone: "",
    reporterEmail: "",
    relationship: "",
    policeReported: "No",
    policeDetails: "",
    injuries: "No",
    injuryDetails: "",
    anonymous: false,
    locationType: "Street",
  });

  // Drag and drop (multiple files)
  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true });

  // Geolocation
  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => alert("Unable to fetch location")
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Map click handler
  const handleMapClick = (e) => {
    setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    setManual(false);
  };

  // Manual location change
  const handleManualChange = (e) => {
    setLocation({ ...location, [e.target.name]: parseFloat(e.target.value) });
    setManual(true);
  };

  // Form change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  // Submit handler (stub)
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Report submitted! (stub)");
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 min-h-screen">
      <div style={{ maxWidth: 800, margin: "40px auto", padding: 36, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001", color: '#000', fontSize: '1.1rem' }}>
        <h2 style={{ color: '#000', fontSize: '2rem', marginBottom: 16 }}>Report a Crime</h2>
        <form onSubmit={handleSubmit} style={{ fontSize: '1.1rem' }}>
          {/* Incident Details */}
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Incident Details</h3>
            <label>Date of Incident<br /><input type="date" name="date" value={form.date} onChange={handleChange} style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label><br />
            <label>Time of Incident<br /><input type="time" name="time" value={form.time} onChange={handleChange} style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label><br />
            <label>Exact Address<br /><input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Enter address or landmark" style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label><br />
            <label>Location Type<br />
              <select name="locationType" value={form.locationType} onChange={handleChange} style={{ width: '100%', marginBottom: 8, color: '#000' }}>
                <option>Street</option>
                <option>Home</option>
                <option>Business</option>
                <option>Public Transport</option>
                <option>Park</option>
                <option>Other</option>
              </select>
            </label>
          </div>
          {/* Reporter Type, Security, Crime Type */}
          <div style={{ color: '#000', marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Report Type</h3>
            <b>Reporter Type</b><br />
            <label style={{ color: '#000' }}><input type="radio" name="reporterType" value="Victim" checked={form.reporterType === "Victim"} onChange={handleChange} /> Victim</label>
            <label style={{ marginLeft: 16, color: '#000' }}><input type="radio" name="reporterType" value="Spectator" checked={form.reporterType === "Spectator"} onChange={handleChange} /> Spectator</label>
            <br /><b>Security Availability</b><br />
            {['None', 'Minimal', 'Normal', 'Excessive'].map(opt => (
              <label key={opt} style={{ marginRight: 16, color: '#000' }}>
                <input type="radio" name="security" value={opt} checked={form.security === opt} onChange={handleChange} /> {opt}
              </label>
            ))}
            <br /><b>Crime Type</b><br />
            {['Chain Snatching', 'Vandalism', 'Pick Pocketing', 'Eve Teasing'].map(opt => (
              <label key={opt} style={{ marginRight: 16, color: '#000' }}>
                <input type="radio" name="crimeType" value={opt} checked={form.crimeType === opt} onChange={handleChange} /> {opt}
              </label>
            ))}
          </div>
          {/* Suspect & Vehicle Info */}
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Suspect & Vehicle</h3>
            <label>Number of Suspects<br /><input type="number" name="numSuspects" value={form.numSuspects} onChange={handleChange} min="1" style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label><br />
            <label>Suspect Description<br /><textarea name="suspectDescription" value={form.suspectDescription} onChange={handleChange} rows={2} placeholder="Appearance, clothing, etc." style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label><br />
            <label>Vehicle Information<br /><input type="text" name="vehicleInfo" value={form.vehicleInfo} onChange={handleChange} placeholder="Type, color, license plate, etc." style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label>
          </div>
          {/* Witness Info */}
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Witnesses</h3>
            <label>Witness Information<br /><textarea name="witnessInfo" value={form.witnessInfo} onChange={handleChange} rows={2} placeholder="Names, contact, statements" style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label>
          </div>
          {/* File Upload */}
          <div style={{ marginTop: 16, color: '#000', marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Evidence Upload</h3>
            <b>Upload Files (images, videos, etc.):</b><br />
            <div {...getRootProps()} style={{ border: '2px dashed #888', padding: 20, borderRadius: 8, background: isDragActive ? '#e0e7ff' : '#f9f9f9', cursor: 'pointer', marginBottom: 8, color: '#000' }}>
              <input {...getInputProps()} />
              {isDragActive ? <p style={{ color: '#000' }}>Drop files here ...</p> : <p style={{ color: '#000' }}>Drag & drop files here, or click to select</p>}
              {files.length > 0 && <div style={{ marginTop: 8, color: '#000' }}>Selected: <b>{files.map(f => f.name).join(", ")}</b></div>}
            </div>
          </div>
          {/* Location Picker */}
          <div style={{ marginTop: 16, color: '#000', marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Location</h3>
            <button type="button" onClick={fetchLocation} style={{ marginBottom: 8, color: '#000' }}>Use My Current Location</button>
            <div style={{ height: 300, marginBottom: 8 }}>
              <MapContainer
                center={[location.lat, location.lng]}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
                whenCreated={map => map.on('click', handleMapClick)}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[location.lat, location.lng]} icon={markerIcon} />
              </MapContainer>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#000' }}>
              <label style={{ color: '#000' }}>Lat: <input type="number" step="0.0001" name="lat" value={location.lat} onChange={handleManualChange} style={{ width: 110, color: '#000' }} /></label>
              <label style={{ color: '#000' }}>Lng: <input type="number" step="0.0001" name="lng" value={location.lng} onChange={handleManualChange} style={{ width: 110, color: '#000' }} /></label>
            </div>
          </div>
          {/* Description */}
          <div style={{ marginTop: 16, color: '#000', marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Incident Description</h3>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the incident in detail"
              rows={4}
              style={{ width: '100%', borderRadius: 6, border: '1px solid #ccc', padding: 8, color: '#000' }}
            />
          </div>
          {/* Police & Medical */}
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Police & Medical</h3>
            <label>Was the incident reported to the police? <br />
              <select name="policeReported" value={form.policeReported} onChange={handleChange} style={{ width: '100%', marginBottom: 8, color: '#000' }}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </label>
            {form.policeReported === 'Yes' && (
              <label>Police Report Details<br /><textarea name="policeDetails" value={form.policeDetails} onChange={handleChange} rows={2} placeholder="FIR number, station, etc." style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label>
            )}
            <label>Any injuries or medical attention required? <br />
              <select name="injuries" value={form.injuries} onChange={handleChange} style={{ width: '100%', marginBottom: 8, color: '#000' }}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </label>
            {form.injuries === 'Yes' && (
              <label>Injury Details<br /><textarea name="injuryDetails" value={form.injuryDetails} onChange={handleChange} rows={2} placeholder="Describe injuries, medical help, etc." style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label>
            )}
          </div>
          {/* Reporter Info */}
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Reporter Information</h3>
            <label>Name<br /><input type="text" name="reporterName" value={form.reporterName} onChange={handleChange} style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label><br />
            <label>Phone<br /><input type="tel" name="reporterPhone" value={form.reporterPhone} onChange={handleChange} style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label><br />
            <label>Email<br /><input type="email" name="reporterEmail" value={form.reporterEmail} onChange={handleChange} style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label><br />
            <label>Relationship to Victim<br /><input type="text" name="relationship" value={form.relationship} onChange={handleChange} placeholder="Self, friend, relative, etc." style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label><br />
            <label><input type="checkbox" name="anonymous" checked={form.anonymous} onChange={handleChange} style={{ marginRight: 8 }} /> I want to remain anonymous</label>
          </div>
          {/* Buttons */}
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button type="submit" style={{ background: '#223388', color: '#fff', border: 0, borderRadius: 4, padding: '8px 18px', fontWeight: 600 }}>Submit Report</button>
            <button type="button" style={{ background: '#888', color: '#fff', border: 0, borderRadius: 4, padding: '8px 18px' }} onClick={() => window.history.back()}>Back</button>
          </div>
        </form>
      </div>
    </div>
  );
}
