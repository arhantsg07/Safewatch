"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import EXIF from "exif-js";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  MapPin,
  FileText,
  Users,
  Shield,
  CheckCircle,
  Loader2,
  X,
  Image as ImageIcon,
} from "lucide-react";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const MapEventHandler = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { useMapEvents } = mod;
      return function MapClickHandler({ onMapClick }) {
        useMapEvents({ click: onMapClick });
        return null;
      };
    }),
  { ssr: false }
);

const STEPS = [
  { id: 1, label: "Incident", icon: FileText },
  { id: 2, label: "Details", icon: Users },
  { id: 3, label: "Evidence", icon: Upload },
  { id: 4, label: "Location", icon: MapPin },
  { id: 5, label: "Review", icon: CheckCircle },
];

const CRIME_TYPES = [
  "Chain Snatching",
  "Vandalism",
  "Pick Pocketing",
  "Eve Teasing",
  "Assault",
  "Theft",
  "Robbery",
  "Other",
];

const LOCATION_TYPES = [
  "Street",
  "Home",
  "Business",
  "Public Transport",
  "Park",
  "Other",
];

export default function ReportCrimePage() {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.209 });
  const [markerIcon, setMarkerIcon] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    time_of_incident_date: "",
    time_of_incident_time: "",
    address: "",
    location_type: "Street",
    reporter_type: "Victim",
    security_availability: "None",
    crime_type: "",
    num_suspects: "",
    suspect_description: "",
    vehicle_info: "",
    witness_info: "",
    incident_description: "",
    reported_to_police: false,
    police_details: "",
    medical_attention_required: false,
    injury_details: "",
    reporter_name: "",
    reporter_email: "",
    reporter_phone: "",
    anonymous: false,
  });

  useEffect(() => {
    setIsClient(true);
    const setupLeafletIcon = async () => {
      if (typeof window !== "undefined") {
        const L = await import("leaflet");
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png",
        });
        setMarkerIcon(
          new L.Icon({
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png",
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon-2x.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })
        );
      }
    };
    setupLeafletIcon();
  }, []);

  // File handling
  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    const newPreviews = acceptedFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
  }, []);

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]?.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: { "image/*": [], "video/*": [] },
  });

  // Location
  const fetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success("Location detected successfully");
      },
      (error) => {
        let msg = "Unable to fetch location.";
        if (error.code === 1) msg += " Permission denied.";
        else if (error.code === 2) msg += " Position unavailable.";
        else if (error.code === 3) msg += " Timeout.";
        toast.error(msg);
      }
    );
  };

  const handleMapClick = (e) => {
    setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const fallbackToFileDate = (file) => {
    const diffDays =
      (new Date() - new Date(file.lastModified)) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      throw new Error("Image is more than 7 days old");
    }
  };

  const uploadEvidenceFiles = async (selectedFiles) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const formData = new FormData();

    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`${apiUrl}/api/upload-evidence`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "Failed to upload evidence");
    }

    return (result.files || [])
      .map((file) => file.url)
      .filter(Boolean);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const user_id = localStorage.getItem("user_id");
    const user_name = localStorage.getItem("username");

    if (!user_id || !user_name) {
      toast.info(
        "Submitting as unauthenticated user. Report won't be linked to an account."
      );
    }

    let evidenceUrls = [];
    if (files.length > 0) {
      try {
        for (const file of files) {
          await new Promise((resolve, reject) => {
            if (!file.type.match(/image\/(jpeg|tiff)/i)) {
              try {
                fallbackToFileDate(file);
                return resolve();
              } catch (err) {
                return reject(err);
              }
            }
            EXIF.getData(file, function () {
              const creationDate = EXIF.getTag(this, "DateTimeOriginal");
              if (!creationDate) {
                try {
                  fallbackToFileDate(file);
                  return resolve();
                } catch (err) {
                  return reject(err);
                }
              }
              const parts = creationDate.split(" ");
              const datePart = parts[0] ? parts[0].replace(/:/g, "-") : "";
              const timePart = parts[1] || "";
              const dateString = timePart ? `${datePart}T${timePart}` : datePart;
              const dateObj = new Date(dateString);
              const diffDays = (new Date() - dateObj) / (1000 * 60 * 60 * 24);
              if (diffDays > 7) {
                reject(new Error("Image is more than 7 days old"));
              } else {
                resolve();
              }
            });
          });
        }

        evidenceUrls = await uploadEvidenceFiles(files);
      } catch (error) {
        toast.error(error.message || "Error processing image metadata");
        setSubmitting(false);
        return;
      }
    }

    const crimeReportData = {
      user_id,
      user_name,
      time_of_incident: `${form.time_of_incident_date}T${form.time_of_incident_time}:00Z`,
      address: form.address,
      location_type: form.location_type,
      reporter_type: form.reporter_type,
      security_availability: form.security_availability,
      crime_type: form.crime_type,
      num_suspects: form.num_suspects ? parseInt(form.num_suspects, 10) : null,
      suspect_description: form.suspect_description || null,
      vehicle_info: form.vehicle_info || null,
      witness_info: form.witness_info || null,
      latitude: location.lat,
      longitude: location.lng,
      incident_description: form.incident_description,
      reported_to_police: form.reported_to_police,
      medical_attention_required: form.medical_attention_required,
      reporter_name: form.anonymous ? null : form.reporter_name || null,
      reporter_email: form.anonymous ? null : form.reporter_email || null,
      reporter_phone: form.anonymous ? null : form.reporter_phone || null,
      evidence_files: evidenceUrls.length > 0 ? evidenceUrls : null,
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/normal-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(crimeReportData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Crime report submitted successfully!");
        setStep(1);
        setForm({
          time_of_incident_date: "", time_of_incident_time: "", address: "",
          location_type: "Street", reporter_type: "Victim",
          security_availability: "None", crime_type: "", num_suspects: "",
          suspect_description: "", vehicle_info: "", witness_info: "",
          incident_description: "", reported_to_police: false, police_details: "",
          medical_attention_required: false, injury_details: "",
          reporter_name: "", reporter_email: "", reporter_phone: "", anonymous: false,
        });
        setFiles([]);
        setPreviews([]);
      } else {
        toast.error(data.detail || "Failed to submit report");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return form.crime_type && form.time_of_incident_date && form.time_of_incident_time && form.address;
      case 2:
        return form.incident_description;
      case 3:
        return true; // evidence is optional
      case 4:
        return location.lat && location.lng;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => s.id < step && setStep(s.id)}
                  className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
                    isActive
                      ? "scale-105"
                      : isCompleted
                      ? "cursor-pointer"
                      : "cursor-default"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30"
                        : isCompleted
                        ? "bg-emerald-500/20 border border-emerald-500/30"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Icon
                        className={`h-5 w-5 ${
                          isActive ? "text-white" : "text-white/40"
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      isActive
                        ? "text-white"
                        : isCompleted
                        ? "text-emerald-400"
                        : "text-white/40"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-2 transition-colors duration-300 ${
                      step > s.id ? "bg-emerald-500/30" : "bg-white/10"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="glass-card p-8 rounded-2xl animate-fade-in">
            {/* Step 1: Crime Type & Incident Details */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Crime Type & Incident</h2>
                  <p className="text-gray-400 text-sm">What happened and when?</p>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Crime Type *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CRIME_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, crime_type: type })}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          form.crime_type === type
                            ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                            : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Date of Incident *</label>
                    <input
                      type="date"
                      name="time_of_incident_date"
                      value={form.time_of_incident_date}
                      onChange={handleChange}
                      className="input-dark"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Time of Incident *</label>
                    <input
                      type="time"
                      name="time_of_incident_time"
                      value={form.time_of_incident_time}
                      onChange={handleChange}
                      className="input-dark"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Address / Landmark *</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter the incident location"
                    className="input-dark"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Location Type</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {LOCATION_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, location_type: type })}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          form.location_type === type
                            ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                            : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Report Details</h2>
                  <p className="text-gray-400 text-sm">Describe the incident and provide suspect information</p>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Reporter Type</label>
                  <div className="flex gap-3">
                    {["Victim", "Spectator"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, reporter_type: type })}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          form.reporter_type === type
                            ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                            : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Security Availability</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["None", "Minimal", "Normal", "Excessive"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm({ ...form, security_availability: opt })}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          form.security_availability === opt
                            ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                            : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Incident Description *</label>
                  <textarea
                    name="incident_description"
                    value={form.incident_description}
                    onChange={handleChange}
                    placeholder="Describe the incident in detail..."
                    rows={4}
                    className="input-dark resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Number of Suspects</label>
                    <input type="number" name="num_suspects" value={form.num_suspects} onChange={handleChange} min="0" className="input-dark" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Vehicle Info</label>
                    <input type="text" name="vehicle_info" value={form.vehicle_info} onChange={handleChange} className="input-dark" placeholder="Type, color, plate..." />
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Suspect Description</label>
                  <textarea name="suspect_description" value={form.suspect_description} onChange={handleChange} rows={2} placeholder="Appearance, clothing, etc." className="input-dark resize-none" />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Witness Information</label>
                  <textarea name="witness_info" value={form.witness_info} onChange={handleChange} rows={2} placeholder="Names, contact info, statements..." className="input-dark resize-none" />
                </div>
              </div>
            )}

            {/* Step 3: Evidence Upload */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Evidence Upload</h2>
                  <p className="text-gray-400 text-sm">Upload photos or videos of the incident (optional)</p>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive
                      ? "border-blue-500/60 bg-blue-500/10"
                      : "border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/5"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-10 w-10 text-white/30 mx-auto mb-4" />
                  {isDragActive ? (
                    <p className="text-blue-300 font-medium">Drop files here...</p>
                  ) : (
                    <>
                      <p className="text-white/70 font-medium mb-1">
                        Drag & drop files here, or click to select
                      </p>
                      <p className="text-white/30 text-sm">
                        Images and videos accepted
                      </p>
                    </>
                  )}
                </div>

                {previews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
                          {preview.type?.startsWith("image/") ? (
                            <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-white/30" />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="h-3.5 w-3.5 text-white" />
                        </button>
                        <p className="text-xs text-white/40 mt-1 truncate">{preview.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Location */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Incident Location</h2>
                  <p className="text-gray-400 text-sm">Pin the exact location on the map</p>
                </div>

                <button
                  type="button"
                  onClick={fetchLocation}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 transition-all text-sm font-medium"
                >
                  <MapPin className="h-4 w-4" />
                  Use My Current Location
                </button>

                <div className="h-[350px] rounded-xl overflow-hidden border border-white/10">
                  {isClient && (
                    <MapContainer
                      center={[location.lat, location.lng]}
                      zoom={15}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {markerIcon && <Marker position={[location.lat, location.lng]} icon={markerIcon} />}
                      <MapEventHandler onMapClick={handleMapClick} />
                    </MapContainer>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-white/40 text-xs font-medium mb-1">Latitude</label>
                    <input type="text" value={location.lat.toFixed(6)} readOnly className="input-dark text-sm bg-white/[0.02]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-white/40 text-xs font-medium mb-1">Longitude</label>
                    <input type="text" value={location.lng.toFixed(6)} readOnly className="input-dark text-sm bg-white/[0.02]" />
                  </div>
                </div>

                {/* Police & Medical */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-lg font-semibold text-white">Additional Information</h3>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
                    <input type="checkbox" name="reported_to_police" checked={form.reported_to_police} onChange={handleChange} className="w-4 h-4 rounded" />
                    <span className="text-sm text-white/80">Was this reported to the police?</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
                    <input type="checkbox" name="medical_attention_required" checked={form.medical_attention_required} onChange={handleChange} className="w-4 h-4 rounded" />
                    <span className="text-sm text-white/80">Medical attention required?</span>
                  </label>

                  {!form.anonymous && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input type="text" name="reporter_name" value={form.reporter_name} onChange={handleChange} placeholder="Your name" className="input-dark text-sm" />
                      <input type="email" name="reporter_email" value={form.reporter_email} onChange={handleChange} placeholder="Email" className="input-dark text-sm" />
                      <input type="tel" name="reporter_phone" value={form.reporter_phone} onChange={handleChange} placeholder="Phone" className="input-dark text-sm" />
                    </div>
                  )}

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
                    <input type="checkbox" name="anonymous" checked={form.anonymous} onChange={handleChange} className="w-4 h-4 rounded" />
                    <span className="text-sm text-white/80">Report anonymously</span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Review & Submit</h2>
                  <p className="text-gray-400 text-sm">Verify all information before submitting</p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Crime Type", value: form.crime_type },
                    { label: "Date & Time", value: `${form.time_of_incident_date} at ${form.time_of_incident_time}` },
                    { label: "Address", value: form.address },
                    { label: "Location Type", value: form.location_type },
                    { label: "Reporter Type", value: form.reporter_type },
                    { label: "Description", value: form.incident_description },
                    { label: "Coordinates", value: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` },
                    { label: "Evidence", value: files.length > 0 ? `${files.length} file(s) attached` : "None" },
                    { label: "Police Report", value: form.reported_to_police ? "Yes" : "No" },
                    { label: "Medical Required", value: form.medical_attention_required ? "Yes" : "No" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-start py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-white/40">{item.label}</span>
                      <span className="text-sm text-white/90 text-right max-w-[60%]">{item.value || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
                >
                  Cancel
                </button>
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Submit Report
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
