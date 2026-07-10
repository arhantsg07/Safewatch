"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import EXIF from "exif-js";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import {
  AlertTriangle,
  Upload,
  MapPin,
  ShieldAlert,
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

const CRIME_TYPES = [
  "Chain Snatching",
  "Vandalism",
  "Pick Pocketing",
  "Eve Teasing",
  "Other",
];

export default function EmergencyAlertPage() {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.209 });
  const [markerIcon, setMarkerIcon] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    reporter_type: "Victim",
    security_availability: "None",
    crime_type: "Other",
    description: "",
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
    
    // Automatically try to fetch location on load for emergency
    fetchLocation(true);
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setFile(f);
      setPreview({
        name: f.name,
        url: URL.createObjectURL(f),
        type: f.type,
      });
    }
  }, []);

  const removeFile = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "image/*": [], "video/*": [] },
  });

  const fetchLocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) toast.error("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (!silent) toast.success("Location detected successfully");
      },
      (error) => {
        if (!silent) {
            let msg = "Unable to fetch location.";
            if (error.code === 1) msg += " Permission denied.";
            else if (error.code === 2) msg += " Position unavailable.";
            else if (error.code === 3) msg += " Timeout.";
            toast.error(msg);
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleMapClick = (e) => {
    setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fallbackToFileDate = () => {
    const diffDays = (new Date() - new Date(file.lastModified)) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      throw new Error("Image is more than 7 days old");
    }
  };

  const uploadEvidenceFile = async (selectedFile) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const formData = new FormData();
    formData.append("files", selectedFile);

    const response = await fetch(`${apiUrl}/api/upload-evidence`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "Failed to upload evidence");
    }

    return result.files?.[0]?.url || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const user_id = localStorage.getItem("user_id");
    const user_name = localStorage.getItem("username");

    let evidenceUrl = null;
    if (file) {
      try {
        await new Promise((resolve, reject) => {
          if (!file.type.match(/image\/(jpeg|tiff)/i)) {
            try {
              fallbackToFileDate();
              return resolve();
            } catch (err) {
              return reject(err);
            }
          }
          EXIF.getData(file, function () {
            const creationDate = EXIF.getTag(this, "DateTimeOriginal");
            if (!creationDate) {
              try {
                fallbackToFileDate();
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
              reject(new Error("Image is more than 7 days old."));
            } else {
              resolve();
            }
          });
        });

          evidenceUrl = await uploadEvidenceFile(file);
      } catch (error) {
        toast.error(error.message || "Error processing image upload");
        setSubmitting(false);
        return;
      }
    }

    const emergencyReportData = {
      user_id,
      user_name,
      reporter_type: form.reporter_type,
      security_availability: form.security_availability,
      crime_type: form.crime_type,
      evidence_url: evidenceUrl,
      latitude: location.lat,
      longitude: location.lng,
      description: form.description,
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/emergency-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emergencyReportData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Emergency report submitted successfully! Authorities have been alerted.");
        setForm({
            reporter_type: "Victim",
            security_availability: "None",
            crime_type: "Other",
            description: "",
        });
        removeFile();
      } else {
        toast.error(data.detail || "Failed to submit report");
      }
    } catch (error) {
      console.error("Error submitting emergency report:", error);
      toast.error("Failed to submit emergency report. Please call local authorities immediately.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
        <div className="animate-pulse-glow rounded-3xl p-1 mb-8">
          <div className="bg-red-950/80 backdrop-blur-xl border border-red-500/30 rounded-[1.4rem] p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-2xl mb-4 shadow-lg shadow-red-500/40 animate-pulse">
              <ShieldAlert className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Emergency Alert</h1>
            <p className="text-red-200 text-sm max-w-md mx-auto">
              If this is an immediate life-threatening emergency, please also call local emergency services directly.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Details</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">I am a...</label>
                <div className="flex gap-2">
                  {["Victim", "Spectator"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, reporter_type: type })}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        form.reporter_type === type
                          ? "bg-red-500/20 border border-red-500/40 text-red-300"
                          : "bg-white/5 border border-white/10 text-white/60"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Incident Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {CRIME_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, crime_type: type })}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                        form.crime_type === type
                          ? "bg-red-500/20 border border-red-500/40 text-red-300"
                          : "bg-white/5 border border-white/10 text-white/60"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Briefly describe what is happening..."
                  rows={3}
                  className="input-dark resize-none focus:border-red-500 focus:ring-red-500/20"
                  required
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Location *</h2>
              <button
                type="button"
                onClick={() => fetchLocation(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" />
                Refresh Location
              </button>
            </div>
            
            <div className="h-[250px] rounded-xl overflow-hidden border border-white/10 mb-3">
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
            
             <p className="text-xs text-white/40 text-center">
              Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-4">Evidence (Optional)</h2>
            
            {!preview ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-white/15 bg-white/5 hover:border-white/25"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 text-white/30 mx-auto mb-2" />
                  <p className="text-white/70 text-sm font-medium">Tap to upload photo/video</p>
                </div>
            ) : (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
                    {preview.type?.startsWith("image/") ? (
                        <img src={preview.url} alt={preview.name} className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-white/30 mb-2" />
                            <span className="text-white/50 text-sm">{preview.name}</span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={removeFile}
                        className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-md"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold text-lg transition-all shadow-lg shadow-red-500/30"
          >
            {submitting ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <AlertTriangle className="h-6 w-6" />
                SEND EMERGENCY ALERT
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
