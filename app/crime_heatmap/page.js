"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import { Layers, Crosshair, Map as MapIcon, Loader2 } from "lucide-react";

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
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// We need a wrapper component for HeatmapLayer since it uses useMap internally
const HeatmapWrapper = dynamic(
  () => import("@/components/HeatmapWrapper"),
  { ssr: false }
);

export default function GeoMap() {
  const toast = useToast();
  const [userPosition, setUserPosition] = useState(null);
  const [heatPoints, setHeatPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markerIcon, setMarkerIcon] = useState(null);

  useEffect(() => {
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

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn("Geolocation error:", err);
          setUserPosition([28.6139, 77.209]); // fallback: Delhi
        }
      );
    } else {
      setUserPosition([28.6139, 77.209]);
    }
  }, []);

  useEffect(() => {
    async function fetchHeatmapData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${apiUrl}/heatmap/coordinates`);
        
        if (!res.ok) throw new Error("Failed to fetch coordinates");
        
        const data = await res.json();

        if (Array.isArray(data)) {
          const coords = data
            .filter((item) => item.latitude !== null && item.longitude !== null)
            .map((item) => [item.latitude, item.longitude]);
          setHeatPoints(coords);
        } else {
          console.error("Invalid API response:", data);
        }
      } catch (error) {
        console.error("Failed to fetch heatmap data:", error);
        toast.error("Could not load heatmap data");
      } finally {
        setLoading(false);
      }
    }

    fetchHeatmapData();
  }, [toast]);

  return (
    <div className="relative h-screen w-full bg-slate-900 overflow-hidden">
      <Navbar transparent={false} />

      {/* Floating Control Panel */}
      <div className="absolute top-24 left-4 z-[400] w-72 glass-card p-5 animate-fade-in shadow-2xl">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
            <MapIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold leading-tight">Crime Heatmap</h1>
            <p className="text-white/50 text-xs">Real-time incident density</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-white/80">Active Data Points</span>
              <span className="text-sm font-bold text-white">
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin inline-block" />
                ) : (
                  heatPoints.length
                )}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
              Intensity Legend
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                <span className="text-sm text-white/80">High Density</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]" />
                <span className="text-sm text-white/80">Medium Density</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <span className="text-sm text-white/80">Low Density</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="h-full w-full pt-16">
        {!userPosition || loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/20 animate-pulse" />
              <Loader2 className="h-10 w-10 text-blue-400 animate-spin relative z-10" />
            </div>
            <p className="text-white/60 mt-4 font-medium animate-pulse">Initializing map engine...</p>
          </div>
        ) : (
          <MapContainer
            center={userPosition}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {markerIcon && (
              <Marker position={userPosition} icon={markerIcon}>
                <Popup className="custom-popup">
                  <div className="text-center p-1">
                    <Crosshair className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <strong>Your Location</strong>
                  </div>
                </Popup>
              </Marker>
            )}

            <HeatmapWrapper points={heatPoints} />
          </MapContainer>
        )}
      </div>

      <style jsx global>{`
        .leaflet-container {
          background: #0f172a;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 12px;
        }
        .custom-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
