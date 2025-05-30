"use client";
import dynamic from "next/dynamic";

const CrimeHeatMapCanvas = dynamic(() => import("@/components/ui/CrimeHeatMapCanvas"), {
  ssr: false,
});

export default function HeatmapPage() {
  return <CrimeHeatMapCanvas />;
}
