"use client";

import { useEffect, useRef } from "react";

// Map bounds (NYC)
const BOUNDS = {
  north: 40.75,
  south: 40.68,
  west: -74.03,
  east: -73.95,
};

// Static map
const MAP_IMAGE_URL = "/map.jpg"; // place this in /public

// Generate random crime points
function generateCrimePoints(center, radiusKm = 5, count = 300) {
  const [lat, lng] = center;
  const points = [];

  for (let i = 0; i < count; i++) {
    const latOffset = (Math.random() - 0.5) * (radiusKm / 111);
    const lngOffset = (Math.random() - 0.5) * (radiusKm / 111);
    const intensity = Math.random();
    points.push({ lat: lat + latOffset, lng: lng + lngOffset, intensity });
  }

  return points;
}

// Map lat/lng to canvas
function latLngToCanvas({ lat, lng }, width, height) {
  const x = ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * width;
  const y = ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * height;
  return { x, y };
}

// Get color based on intensity
function getColor(intensity) {
  if (intensity < 0.25) return "rgba(0, 0, 255, 0.6)";     // Blue
  if (intensity < 0.5) return "rgba(0, 255, 0, 0.6)";       // Green
  if (intensity < 0.75) return "rgba(255, 255, 0, 0.6)";    // Yellow
  return "rgba(255, 0, 0, 0.7)";                            // Red
}

export default function CrimeHeatMapCanvas() {
  const canvasRef = useRef(null);
  const width = 800;
  const height = 600;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const center = [40.7128, -74.006];
    const image = new Image();
    image.src = MAP_IMAGE_URL;

    image.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      const points = generateCrimePoints(center);

      points.forEach((point) => {
        const { x, y } = latLngToCanvas(point, width, height);
        const shiftedX = x + 10;
        const color = getColor(point.intensity);
        const radius = 10 + point.intensity * 15;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      drawLegend(ctx, width - 160, 30);
    };
  }, []);

  // Draw a legend
  function drawLegend(ctx, x, y) {
    const legendItems = [
      { label: "High", color: "rgba(255, 0, 0, 0.7)" },
      { label: "Medium-High", color: "rgba(255, 255, 0, 0.6)" },
      { label: "Medium", color: "rgba(0, 255, 0, 0.6)" },
      { label: "Low", color: "rgba(0, 0, 255, 0.6)" },
    ];

    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillRect(x - 10, y - 10, 130, 110);
    ctx.strokeStyle = "#333";
    ctx.strokeRect(x - 10, y - 10, 130, 110);

    legendItems.forEach((item, i) => {
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y + i * 25, 20, 20);
      ctx.fillStyle = "#000";
      ctx.fillText(item.label, x + 30, y + i * 25 + 15);
    });
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-cyan-800 via-purple-600 to-cyan-400">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-white rounded shadow-lg"
      />
    </div>
  );
}
