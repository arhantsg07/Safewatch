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
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.209 }); // Default: Delhi
  const [manual, setManual] = useState(false);
  const [form, setForm] = useState({
    reporterType: "Victim",
    security: "None",
    crimeType: "Chain Snatching",
    description: "",
  });

  // Drag and drop
  const onDrop = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit handler (stub)
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Report submitted! (stub)");
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 min-h-screen">
      <div style={{ maxWidth: 800, margin: "40px auto", padding: 36, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001", color: '#000', fontSize: '1.1rem' }}>
        <h2 style={{ color: '#000', fontSize: '2rem', marginBottom: 16 }}>Emergency Alert</h2>
        <form onSubmit={handleSubmit} style={{ fontSize: '1.1rem' }}>
          {/* Reporter Type */}
          <div style={{ color: '#000' }}>
            <b>Reporter Type</b><br />
            <label style={{ color: '#000' }}><input type="radio" name="reporterType" value="Victim" checked={form.reporterType === "Victim"} onChange={handleChange} /> Victim</label>
            <label style={{ marginLeft: 16, color: '#000' }}><input type="radio" name="reporterType" value="Spectator" checked={form.reporterType === "Spectator"} onChange={handleChange} /> Spectator</label>
          </div>
          {/* Security Availability */}
          <div style={{ marginTop: 12, color: '#000' }}>
            <b>Security Availability</b><br />
            {['None', 'Minimal', 'Normal', 'Excessive'].map(opt => (
              <label key={opt} style={{ marginRight: 16, color: '#000' }}>
                <input type="radio" name="security" value={opt} checked={form.security === opt} onChange={handleChange} /> {opt}
              </label>
            ))}
          </div>
          {/* Crime Type */}
          <div style={{ marginTop: 12, color: '#000' }}>
            <b>Crime Type</b><br />
            {['Chain Snatching', 'Vandalism', 'Pick Pocketing', 'Eve Teasing'].map(opt => (
              <label key={opt} style={{ marginRight: 16, color: '#000' }}>
                <input type="radio" name="crimeType" value={opt} checked={form.crimeType === opt} onChange={handleChange} /> {opt}
              </label>
            ))}
          </div>
          {/* File Upload */}
          <div style={{ marginTop: 16, color: '#000' }}>
            <b>Upload a File:</b><br />
            <div {...getRootProps()} style={{ border: '2px dashed #888', padding: 20, borderRadius: 8, background: isDragActive ? '#e0e7ff' : '#f9f9f9', cursor: 'pointer', marginBottom: 8, color: '#000' }}>
              <input {...getInputProps()} />
              {isDragActive ? <p style={{ color: '#000' }}>Drop the file here ...</p> : <p style={{ color: '#000' }}>Drag & drop a file here, or click to select</p>}
              {file && <div style={{ marginTop: 8, color: '#000' }}>Selected: <b>{file.name}</b></div>}
            </div>
          </div>
          {/* Location Picker */}
          <div style={{ marginTop: 16, color: '#000' }}>
            <b>Location:</b><br />
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
          <div style={{ marginTop: 16, color: '#000' }}>
            <b>Description</b><br />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the incident in detail"
              rows={4}
              style={{ width: '100%', borderRadius: 6, border: '1px solid #ccc', padding: 8, color: '#000' }}
            />
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
