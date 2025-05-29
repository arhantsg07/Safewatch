"use client";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import { supabase } from "../../lib/supabaseClient"; // Adjust the path based on your project structure

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
    user_id: "", // This should be set from your auth context
    reporter_type: "Victim",
    security_availability: "None",
    crime_type: "Other", // Defaulting to Other as specific types might not map directly to general crime types in emergency
    description: "",
    // evidence_url will be derived from the file upload
  });

  // Drag and drop (single file)
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
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

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Retrieve user_id and username directly from localStorage
    const user_id = localStorage.getItem("user_id");
    const user_name = localStorage.getItem("username");

    console.log("Debugging: Retrieved user_id from localStorage:", user_id); // Debugging
    console.log("Debugging: Retrieved username from localStorage:", user_name); // Debugging

    if (!user_id || !user_name) {
      alert("You are submitting this report as an unauthenticated user. Your report will not be linked to an account.");
    }

    let evidenceUrl = null;
    if (file) {
      try {
        const { data, error } = await supabase.storage
          .from("evidence")
          .upload(`evidence/${Date.now()}_${file.name}`, file);

        if (error) {
          console.error("Error uploading file:", error);
          alert("Failed to upload evidence. Please try again.");
          return;
        }

        const { data: publicUrlData, error: publicUrlError } = supabase
          .storage
          .from("evidence")
          .getPublicUrl(data.path);

        if (publicUrlError) {
          console.error("Error getting public URL:", publicUrlError);
          alert("Failed to get public URL.");
          return;
        }

        evidenceUrl = publicUrlData?.publicUrl;
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Failed to upload evidence. Please try again.");
        return;
      }
    }

    // Ensure the payload matches the EmergencyReport model
    const emergencyReportData = {
      user_id, // Retrieved from localStorage or null
      user_name, // Retrieved from localStorage or null
      reporter_type: form.reporter_type,
      security_availability: form.security_availability,
      crime_type: form.crime_type,
      evidence_url: evidenceUrl, // Optional field
      latitude: location.lat,
      longitude: location.lng,
      description: form.description,
    };

    console.log("Debugging: Payload being sent to backend:", emergencyReportData); // Debugging

    try {
      const response = await fetch("http://localhost:5000/api/emergency-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emergencyReportData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Emergency report submitted successfully!");
      } else {
        alert(`Error: ${data.detail || "Failed to submit report"}`);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 min-h-screen">
      <div style={{ maxWidth: 800, margin: "40px auto", padding: 36, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001", color: '#000', fontSize: '1.1rem' }}>
        <h2 style={{ color: '#000', fontSize: '2rem', marginBottom: 16 }}>Emergency Alert</h2>
        <form onSubmit={handleSubmit} style={{ fontSize: '1.1rem' }}>
          {/* Reporter Type */}
          <div style={{ color: '#000', marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Report Details</h3>
            <b>Reporter Type</b><br />
            <label style={{ color: '#000' }}><input type="radio" name="reporter_type" value="Victim" checked={form.reporter_type === "Victim"} onChange={handleChange} /> Victim</label>
            <label style={{ marginLeft: 16, color: '#000' }}><input type="radio" name="reporter_type" value="Spectator" checked={form.reporter_type === "Spectator"} onChange={handleChange} /> Spectator</label>
          </div>

          {/* Security Availability */}
          <div style={{ color: '#000', marginBottom: 18 }}>
            <b>Security Availability</b><br />
            {['None', 'Minimal', 'Normal', 'Excessive'].map(opt => (
              <label key={opt} style={{ marginRight: 16, color: '#000' }}>
                <input type="radio" name="security_availability" value={opt} checked={form.security_availability === opt} onChange={handleChange} /> {opt}
              </label>
            ))}
          </div>

          {/* Crime Type - Keeping this for now based on existing form, might need refinement for emergency types */}
          <div style={{ color: '#000', marginBottom: 18 }}>
            <b>Crime Type</b><br />
             {/* The crime types listed here might need to be adjusted for emergency situations */}
            {['Chain Snatching', 'Vandalism', 'Pick Pocketing', 'Eve Teasing', 'Other'].map(opt => (
              <label key={opt} style={{ marginRight: 16, color: '#000' }}>
                <input type="radio" name="crime_type" value={opt} checked={form.crime_type === opt} onChange={handleChange} /> {opt}
              </label>
            ))}
          </div>

          {/* File Upload */}
          <div style={{ marginTop: 16, color: '#000', marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Evidence Upload</h3>
            <b>Upload a File:</b><br />
            <div {...getRootProps()} style={{ border: '2px dashed #888', padding: 20, borderRadius: 8, background: isDragActive ? '#e0e7ff' : '#f9f9f9', cursor: 'pointer', marginBottom: 8, color: '#000' }}>
              <input {...getInputProps()} />
              {isDragActive ? <p style={{ color: '#000' }}>Drop the file here ...</p> : <p style={{ color: '#000' }}>Drag & drop a file here, or click to select</p>}
              {file && <div style={{ marginTop: 8, color: '#000' }}>Selected: <b>{file.name}</b></div>}
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
              <label style={{ color: '#000' }}>Lat: <input type="number" step="0.0001" name="lat" value={location.lat} onChange={handleManualChange} style={{ width: 110, color: '#000' }} readOnly /></label>
              <label style={{ color: '#000' }}>Lng: <input type="number" step="0.0001" name="lng" value={location.lng} onChange={handleManualChange} style={{ width: 110, color: '#000' }} readOnly /></label>
            </div>
             {/* Added readOnly to lat/lng inputs as they are controlled by map/geolocation */}
          </div>

          {/* Description */}
          <div style={{ marginTop: 16, color: '#000', marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Emergency Description</h3>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the emergency in detail"
              rows={4}
              style={{ width: '100%', borderRadius: 6, border: '1px solid #ccc', padding: 8, color: '#000' }}
              required
            />
          </div>

          {/* Buttons */}
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button type="submit" style={{ background: '#223388', color: '#fff', border: 0, borderRadius: 4, padding: '8px 18px', fontWeight: 600 }}>Submit Emergency Report</button>
            <button type="button" style={{ background: '#888', color: '#fff', border: 0, borderRadius: 4, padding: '8px 18px' }} onClick={() => window.history.back()}>Back</button>
          </div>
        </form>
      </div>
    </div>
  );
}
