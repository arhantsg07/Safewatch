"use client";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import { supabase } from "@/lib/supabaseClient"; // Adjust the import based on your project structure
import EXIF from "exif-js"; // Import the exif-js library

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
  const [files, setFiles] = useState([]); // Multiple files
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.209 });
  const [manual, setManual] = useState(false);
  const [form, setForm] = useState({
    user_id: "", // This should be set from your auth context
  
    time_of_incident_date: "",
    time_of_incident_time: "",
    address: "",
    location_type: "Street",
    reporter_type: "Victim",
    security_availability: "None",
    crime_type: "Chain Snatching",
    num_suspects: "",
    suspect_description: "",
    vehicle_info: "",
    witness_info: "",
    incident_description: "",
    reported_to_police: false, // Changed to boolean
    police_details: "", // Keep for conditional rendering
    medical_attention_required: false, // Changed to boolean
    injury_details: "", // Keep for conditional rendering
    reporter_name: "",
    reporter_email: "",
    reporter_phone: "",
    anonymous: false, // Keep if you want to handle anonymous reporting on the frontend or backend
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
          // You might want to reverse geocode here to get the address
          setForm(prevForm => ({ ...prevForm, address: "Fetching address..." })); // Placeholder
          // Example reverse geocoding (requires a service/API)
          // fetch(`YOUR_REVERSE_GEOCODING_API_URL?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
          //   .then(res => res.json())
          //   .then(data => setForm(prevForm => ({ ...prevForm, address: data.formatted_address }))) // Adjust based on API response
          //   .catch(error => {
          //     console.error("Error fetching address:", error);
          //     setForm(prevForm => ({ ...prevForm, address: "Could not fetch address" }));
          //   });
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
    // You might want to reverse geocode here as well
    setForm(prevForm => ({ ...prevForm, address: "Fetching address..." })); // Placeholder
  };

  // Manual location change
  const handleManualChange = (e) => {
    setLocation({ ...location, [e.target.name]: parseFloat(e.target.value) });
    setManual(true);
    // Consider adding a button to manually update address from lat/lng if needed
  };

  // Form change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const fallbackToFileDate = (file) => {
    const creationDateObj = new Date(file.lastModified);
    const currentDate = new Date();
    const diffDays = (currentDate - creationDateObj) / (1000 * 60 * 60 * 24);

    if (diffDays > 7) {
      alert("The uploaded image is more than 7 days old (based on file modified date).");
      throw "Image too old (fallback)";
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const user_id = localStorage.getItem("user_id");
    const user_name = localStorage.getItem("username");

    console.log("Debugging: Retrieved user_id from localStorage:", user_id); // Debugging
    console.log("Debugging: Retrieved username from localStorage:", user_name); // Debugging

    if (!user_id || !user_name) {
      alert("You are submitting this report as an unauthenticated user. Your report will not be linked to an account.");
    }

    let evidenceUrls = [];
    if (files.length > 0) {
      try {
        for (const file of files) {
          // Extract metadata using exif-js
          await new Promise((resolve, reject) => {
            EXIF.getData(file, function () {
              const creationDate = EXIF.getTag(this, "DateTimeOriginal");
              if (!creationDate) {
                console.warn("No EXIF date, using file modified date...");
                try {
                  fallbackToFileDate(file);
                  return resolve();
                } catch (e) {
                  return reject(e);
                }
              } else {
                const creationDateObj = new Date(creationDate.replace(/:/g, "-").replace(" ", "T"));
                const currentDate = new Date();
                const diffDays = (currentDate - creationDateObj) / (1000 * 60 * 60 * 24);

                if (diffDays > 7) {
                  alert("The uploaded image is more than 7 days old. The report will be discarded.");
                  reject("Image too old");
                } else {
                  resolve();
                }
              }
            });
          });

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

          evidenceUrls.push(publicUrlData?.publicUrl);
        }
      } catch (error) {
        console.error("Error processing image metadata:", error);
        return;
      }
    }

    // Ensure the payload matches the NormalReport model
    const crimeReportData = {
      user_id, // Retrieved from localStorage or null
      user_name, // Retrieved from localStorage or null
      time_of_incident: `${form.time_of_incident_date}T${form.time_of_incident_time}:00Z`,
      address: form.address,
      location_type: form.location_type,
      reporter_type: form.reporter_type,
      security_availability: form.security_availability,
      crime_type: form.crime_type,
      num_suspects: form.num_suspects ? parseInt(form.num_suspects, 10) : null,
      suspect_description: form.suspect_description,
      vehicle_info: form.vehicle_info,
      witness_info: form.witness_info,
      latitude: location.lat,
      longitude: location.lng,
      incident_description: form.incident_description,
      reported_to_police: form.reported_to_police,
      medical_attention_required: form.medical_attention_required,
      reporter_name: form.reporter_name,
      reporter_email: form.reporter_email,
      reporter_phone: form.reporter_phone,
      evidence_files: evidenceUrls, // Optional field
    };

    console.log("Debugging: Payload being sent to backend:", crimeReportData); // Debugging

    try {
      const response = await fetch("http://localhost:5000/api/normal-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(crimeReportData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Crime report submitted successfully!");
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
        <h2 style={{ color: '#000', fontSize: '2rem', marginBottom: 16 }}>Report a Crime</h2>
        <form onSubmit={handleSubmit} style={{ fontSize: '1.1rem' }}>
          {/* Crime Type */}
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Crime Type</h3>
            <select
              name="crime_type"
              value={form.crime_type}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 8, color: '#000' }}
              required
            >
              <option value="">Select Crime Type</option>
              <option value="Chain Snatching">Chain Snatching</option>
              <option value="Vandalism">Vandalism</option>
              <option value="Pick Pocketing">Pick Pocketing</option>
              <option value="Eve Teasing">Eve Teasing</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Incident Details */}
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Incident Details</h3>
            <label>Date of Incident<br />
              <input
                type="date"
                name="time_of_incident_date"
                value={form.time_of_incident_date}
                onChange={handleChange}
                style={{ width: '100%', marginBottom: 8, color: '#000' }}
                required
              />
            </label><br />
            <label>Time of Incident<br />
              <input
                type="time"
                name="time_of_incident_time"
                value={form.time_of_incident_time}
                onChange={handleChange}
                style={{ width: '100%', marginBottom: 8, color: '#000' }}
                required
              />
            </label><br />
             <label>Exact Address<br /><input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Enter address or landmark" style={{ width: '100%', marginBottom: 8, color: '#000' }} required /></label><br />
             <label>Location Type<br />
               <select name="location_type" value={form.location_type} onChange={handleChange} style={{ width: '100%', marginBottom: 8, color: '#000' }} required>
                 <option value="">Select Location Type</option>
                 <option>Street</option>
                 <option>Home</option>
                 <option>Business</option>
                 <option>Public Transport</option>
                 <option>Park</option>
                 <option>Other</option>
               </select>
             </label>
          </div>

          {/* Reporter Type, Security */}
          <div style={{ color: '#000', marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Report Details</h3>
            <b>Reporter Type</b><br />
            <label style={{ color: '#000' }}><input type="radio" name="reporter_type" value="Victim" checked={form.reporter_type === "Victim"} onChange={handleChange} /> Victim</label>
            <label style={{ marginLeft: 16, color: '#000' }}><input type="radio" name="reporter_type" value="Spectator" checked={form.reporter_type === "Spectator"} onChange={handleChange} /> Spectator</label>
            <br /><b>Security Availability</b><br />
            {['None', 'Minimal', 'Normal', 'Excessive'].map(opt => (
              <label key={opt} style={{ marginRight: 16, color: '#000' }}>
                <input type="radio" name="security_availability" value={opt} checked={form.security_availability === opt} onChange={handleChange} /> {opt}
              </label>
            ))}
          </div>

          {/* Suspect & Vehicle Info */}
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Suspect & Vehicle</h3>
            <label>Number of Suspects<br /><input type="number" name="num_suspects" value={form.num_suspects} onChange={handleChange} min="1" style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label><br />
            <label>Suspect Description<br /><textarea name="suspect_description" value={form.suspect_description} onChange={handleChange} rows={2} placeholder="Appearance, clothing, etc." style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label><br />
            <label>Vehicle Information<br /><input type="text" name="vehicle_info" value={form.vehicle_info} onChange={handleChange} placeholder="Type, color, license plate, etc." style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label>
          </div>

          {/* Witness Info */}
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Witnesses</h3>
            <label>Witness Information<br /><textarea name="witness_info" value={form.witness_info} onChange={handleChange} rows={2} placeholder="Names, contact, statements" style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label>
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
              <label style={{ color: '#000' }}>Lat: <input type="number" step="0.0001" name="lat" value={location.lat} onChange={handleManualChange} style={{ width: 110, color: '#000' }} readOnly /></label>
              <label style={{ color: '#000' }}>Lng: <input type="number" step="0.0001" name="lng" value={location.lng} onChange={handleManualChange} style={{ width: 110, color: '#000' }} readOnly /></label>
            </div>
             {/* Added readOnly to lat/lng inputs as they are controlled by map/geolocation */}
          </div>

          {/* Incident Description */}
          <div style={{ marginTop: 16, color: '#000', marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Incident Description</h3>
            <textarea
              name="incident_description"
              value={form.incident_description}
              onChange={handleChange}
              placeholder="Describe the incident in detail"
              rows={4}
              style={{ width: '100%', borderRadius: 6, border: '1px solid #ccc', padding: 8, color: '#000' }}
              required
            />
          </div>

          {/* Police & Medical */}
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Police & Medical</h3>
            <label>
              <input
                type="checkbox"
                name="reported_to_police"
                checked={form.reported_to_police}
                onChange={handleChange}
                style={{ marginRight: 8 }}
              /> Was the incident reported to the police?
            </label><br />
            {form.reported_to_police && (
              <label>Police Report Details<br /><textarea name="police_details" value={form.police_details} onChange={handleChange} rows={2} placeholder="FIR number, station, etc." style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label>
            )}
            <label>
              <input
                type="checkbox"
                name="medical_attention_required"
                checked={form.medical_attention_required}
                onChange={handleChange}
                style={{ marginRight: 8 }}
              /> Any injuries or medical attention required?
            </label><br />
            {form.medical_attention_required && (
              <label>Injury Details<br /><textarea name="injury_details" value={form.injury_details} onChange={handleChange} rows={2} placeholder="Describe injuries, medical help, etc." style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label>
            )}
          </div>

          {/* Reporter Information */}
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ color: '#223388', marginBottom: 8 }}>Reporter Information</h3>
             <label>Name<br /><input type="text" name="reporter_name" value={form.reporter_name} onChange={handleChange} style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label><br />
            <label>Phone<br /><input type="tel" name="reporter_phone" value={form.reporter_phone} onChange={handleChange} style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label><br />
            <label>Email<br /><input type="email" name="reporter_email" value={form.reporter_email} onChange={handleChange} style={{ width: '100%', marginBottom: 8, color: '#000' }} /></label><br />
            {/* Keeping anonymous checkbox, but how it affects data saving (e.g., clearing reporter info) needs to be implemented */}
             <label><input type="checkbox" name="anonymous" checked={form.anonymous} onChange={handleChange} style={{ marginRight: 8 }} /> I want to remain anonymous</label>
          </div>

          {/* Buttons */}
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button type="submit" style={{ background: '#223388', color: '#fff', border: 0, borderRadius: 4, padding: '8px 18px', fontWeight: 600 }}>Submit Crime Report</button>
            <button type="button" style={{ background: '#888', color: '#fff', border: 0, borderRadius: 4, padding: '8px 18px' }} onClick={() => window.history.back()}>Back</button>
          </div>
        </form>
      </div>
    </div>
  );
}
