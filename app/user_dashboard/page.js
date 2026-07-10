"use client";
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabaseClient";
import {
  FileText,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  X,
  MapPin,
  Clock,
  Shield,
  Eye,
  AlertTriangle
} from "lucide-react";

export default function UserDashboard() {
  const toast = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Filters
  const [filterType, setFilterType] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      // We check if it's an emergency alert or a normal report based on the table
      // Let's fetch from both and merge
      const { data: normalData, error: normalError } = await supabase
        .from("crime_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (normalError) throw normalError;

      const { data: emergencyData, error: emergencyError } = await supabase
        .from("emergency_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (emergencyError) throw emergencyError;

      // Normalize the data structures slightly for the frontend
      const mappedNormal = normalData.map(c => ({ ...c, report_category: 'Normal' }));
      const mappedEmergency = emergencyData.map(c => ({
        ...c,
        report_category: 'Emergency',
        time_of_incident: c.created_at, // Emergencies happen now
        incident_description: c.description,
        status: c.status || 'Pending'
      }));

      const merged = [...mappedNormal, ...mappedEmergency].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      setComplaints(merged);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast.error("Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = complaints
    .filter((c) => filterType === "All" || c.crime_type === filterType)
    .filter((c) => statusFilter === "All" || c.status === statusFilter)
    .filter((c) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (c.crime_type || "").toLowerCase().includes(searchLower) ||
        (c.incident_description || "").toLowerCase().includes(searchLower) ||
        (c.address || "").toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (sortOrder === "latest") return new Date(b.created_at) - new Date(a.created_at);
      if (sortOrder === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      return 0;
    });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Resolved</span>;
      case "in progress":
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">In Progress</span>;
      case "rejected":
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Pending</span>;
    }
  };

  const getCategoryBadge = (category) => {
    if (category === 'Emergency') {
        return <span className="flex items-center gap-1 text-xs font-bold text-red-400"><AlertTriangle className="h-3 w-3" /> EMERGENCY</span>
    }
    return <span className="text-xs font-medium text-blue-400">Normal Report</span>
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Public Report Directory</h1>
            <p className="text-gray-400">Browse and track incidents reported in your community.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="glass-card px-4 py-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-400" />
                <span className="text-white font-semibold">{complaints.length}</span>
                <span className="text-gray-400 text-sm">Total Reports</span>
             </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-dark pl-10"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-dark"
          >
            <option value="All">All Crime Types</option>
            <option value="Chain Snatching">Chain Snatching</option>
            <option value="Vandalism">Vandalism</option>
            <option value="Pick Pocketing">Pick Pocketing</option>
            <option value="Eve Teasing">Eve Teasing</option>
            <option value="Assault">Assault</option>
            <option value="Theft">Theft</option>
            <option value="Robbery">Robbery</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-dark"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="input-dark flex-1 md:flex-none"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-400 font-medium">Loading reports...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl border-dashed">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
              <Search className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Reports Found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className={`glass-card rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
                  complaint.report_category === 'Emergency' ? 'border-red-500/30 bg-red-950/10' : ''
                }`}
                onClick={() => setSelectedComplaint(complaint)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      {getCategoryBadge(complaint.report_category)}
                      <h3 className="text-lg font-bold text-white mt-1">{complaint.crime_type}</h3>
                    </div>
                    {getStatusBadge(complaint.status)}
                  </div>

                  <p className="text-gray-300 text-sm line-clamp-3 mb-6">
                    {complaint.incident_description || "No description provided."}
                  </p>

                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center text-xs text-gray-400">
                      <MapPin className="h-3.5 w-3.5 mr-2 shrink-0 text-blue-400" />
                      <span className="truncate">{complaint.address || "Location unavailable"}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="h-3.5 w-3.5 mr-2 shrink-0 text-blue-400" />
                      <span>{new Date(complaint.time_of_incident).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 px-6 py-3 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs text-gray-500">ID: {complaint.id.split('-')[0]}</span>
                    <span className="text-xs font-medium text-blue-400 flex items-center group-hover:text-blue-300 transition-colors">
                        View Details <Eye className="h-3 w-3 ml-1" />
                    </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedComplaint(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl animate-slide-up shadow-2xl bg-slate-900 border-white/10">
            <div className="sticky top-0 bg-slate-900/90 backdrop-blur-md px-6 py-4 border-b border-white/10 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedComplaint.report_category === 'Emergency' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {selectedComplaint.report_category === 'Emergency' ? <AlertTriangle className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-none mb-1">
                    {selectedComplaint.crime_type}
                  </h2>
                  <span className="text-xs text-gray-400">Report ID: {selectedComplaint.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                 {getStatusBadge(selectedComplaint.status)}
                 {getCategoryBadge(selectedComplaint.report_category)}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-400" /> Description
                </h3>
                <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedComplaint.incident_description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Time & Location</h3>
                    <div className="space-y-3">
                        <div>
                            <span className="block text-xs text-gray-500 mb-0.5">Time of Incident</span>
                            <span className="text-sm text-white">{new Date(selectedComplaint.time_of_incident).toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500 mb-0.5">Address</span>
                            <span className="text-sm text-white">{selectedComplaint.address || "N/A"}</span>
                        </div>
                        {selectedComplaint.latitude && (
                            <div>
                                <span className="block text-xs text-gray-500 mb-0.5">Coordinates</span>
                                <span className="text-sm text-white font-mono">{selectedComplaint.latitude.toFixed(4)}, {selectedComplaint.longitude.toFixed(4)}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Additional Details</h3>
                    <div className="space-y-3">
                        <div>
                            <span className="block text-xs text-gray-500 mb-0.5">Location Type</span>
                            <span className="text-sm text-white">{selectedComplaint.location_type || "N/A"}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500 mb-0.5">Reported By</span>
                            <span className="text-sm text-white">{selectedComplaint.reporter_type || "N/A"}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500 mb-0.5">Police Notified</span>
                            <span className="text-sm text-white">{selectedComplaint.reported_to_police ? "Yes" : "No"}</span>
                        </div>
                    </div>
                </div>
              </div>

              {selectedComplaint.evidence_files && selectedComplaint.evidence_files.length > 0 && (
                 <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Attached Evidence</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {selectedComplaint.evidence_files.map((url, i) => (
                            <a href={url} target="_blank" rel="noopener noreferrer" key={i} className="block relative aspect-video rounded-lg overflow-hidden border border-white/10 group">
                                <img src={url} alt="Evidence" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                    <span className="text-white text-xs font-medium px-3 py-1.5 bg-blue-500 rounded-full">View Full Image</span>
                                </div>
                            </a>
                        ))}
                    </div>
                 </div>
              )}
               {selectedComplaint.evidence_url && (
                 <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Attached Evidence</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <a href={selectedComplaint.evidence_url} target="_blank" rel="noopener noreferrer" className="block relative aspect-video rounded-lg overflow-hidden border border-white/10 group">
                            <img src={selectedComplaint.evidence_url} alt="Evidence" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                <span className="text-white text-xs font-medium px-3 py-1.5 bg-blue-500 rounded-full">View Full Image</span>
                            </div>
                        </a>
                    </div>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
