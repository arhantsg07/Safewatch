"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabaseClient";
import {
  ShieldAlert,
  Users,
  FileText,
  Activity,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Bot,
  AlertTriangle,
  Loader2
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    inProgress: 0,
    emergency: 0
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
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

      const mappedNormal = normalData.map(c => ({ ...c, report_category: 'Normal' }));
      const mappedEmergency = emergencyData.map(c => ({
        ...c,
        report_category: 'Emergency',
        time_of_incident: c.created_at,
        incident_description: c.description,
        status: c.status || 'Pending'
      }));

      const merged = [...mappedNormal, ...mappedEmergency].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      setComplaints(merged);
      
      // Calculate stats
      setStats({
        total: merged.length,
        pending: merged.filter(c => !c.status || c.status === "Pending").length,
        resolved: merged.filter(c => c.status === "Resolved").length,
        inProgress: merged.filter(c => c.status === "In Progress").length,
        emergency: mappedEmergency.length
      });

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to sync dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, category, newStatus) => {
    try {
      const table = category === 'Emergency' ? 'emergency_reports' : 'crime_reports';
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(`Report status updated to ${newStatus}`);
      fetchData(); // Refresh to ensure sync
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update status.");
    }
  };

  const handleLogout = () => {
    document.cookie = "admin_token=; path=/; max-age=0;";
    toast.info("Logged out successfully");
    router.push("/admin_login");
  };

  const filteredComplaints = complaints
    .filter((c) => statusFilter === "All" || (c.status || "Pending") === statusFilter)
    .filter((c) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (c.crime_type || "").toLowerCase().includes(searchLower) ||
        (c.id || "").toLowerCase().includes(searchLower) ||
        (c.user_name || "").toLowerCase().includes(searchLower)
      );
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "In Progress": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "Rejected": return "text-red-400 bg-red-400/10 border-red-400/20";
      default: return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-12">
      {/* Admin specific minimalist navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
               <ShieldAlert className="h-5 w-5 text-white" />
             </div>
             <span className="text-xl font-bold text-white tracking-tight">Admin Console</span>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={fetchData} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Refresh Data">
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
             </button>
             <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg font-medium text-sm transition-colors">
                <LogOut className="h-4 w-4" /> Logout
             </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 pt-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-6 border-blue-500/20 rounded-2xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-bl-full group-hover:scale-110 transition-transform" />
            <div className="flex justify-between items-start">
               <div>
                 <p className="text-gray-400 text-sm font-medium mb-1">Total Reports</p>
                 <h3 className="text-3xl font-bold text-white">{stats.total}</h3>
               </div>
               <FileText className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          
          <div className="glass-card p-6 border-red-500/20 rounded-2xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/10 rounded-bl-full group-hover:scale-110 transition-transform" />
            <div className="flex justify-between items-start">
               <div>
                 <p className="text-gray-400 text-sm font-medium mb-1">Emergencies</p>
                 <h3 className="text-3xl font-bold text-red-400">{stats.emergency}</h3>
               </div>
               <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
          </div>

          <div className="glass-card p-6 border-yellow-500/20 rounded-2xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-500/10 rounded-bl-full group-hover:scale-110 transition-transform" />
            <div className="flex justify-between items-start">
               <div>
                 <p className="text-gray-400 text-sm font-medium mb-1">Pending Review</p>
                 <h3 className="text-3xl font-bold text-yellow-400">{stats.pending}</h3>
               </div>
               <Clock className="h-6 w-6 text-yellow-400" />
            </div>
          </div>

          <div className="glass-card p-6 border-emerald-500/20 rounded-2xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full group-hover:scale-110 transition-transform" />
            <div className="flex justify-between items-start">
               <div>
                 <p className="text-gray-400 text-sm font-medium mb-1">Resolved Cases</p>
                 <h3 className="text-3xl font-bold text-emerald-400">{stats.resolved}</h3>
               </div>
               <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
             <input
               type="text"
               placeholder="Search by ID, user, or crime type..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="input-dark pl-10 bg-white/[0.02]"
             />
           </div>
           <select
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="input-dark w-full md:w-48 bg-white/[0.02]"
           >
             <option value="All">All Statuses</option>
             <option value="Pending">Pending</option>
             <option value="In Progress">In Progress</option>
             <option value="Resolved">Resolved</option>
             <option value="Rejected">Rejected</option>
           </select>
        </div>

        {/* Data Table */}
        <div className="glass-card rounded-2xl overflow-hidden border-white/5">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                       <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Report Info</th>
                       <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</th>
                       <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">AI Analysis</th>
                       <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status & Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {loading ? (
                        <tr>
                           <td colSpan="4" className="p-12 text-center">
                              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-3" />
                              <p className="text-gray-400">Syncing data from database...</p>
                           </td>
                        </tr>
                    ) : filteredComplaints.length === 0 ? (
                        <tr>
                           <td colSpan="4" className="p-12 text-center">
                              <p className="text-gray-400">No reports match the current filters.</p>
                           </td>
                        </tr>
                    ) : (
                        filteredComplaints.map(c => (
                           <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-4 align-top">
                                 <div className="font-mono text-xs text-gray-500 mb-1">{c.id.split('-')[0]}</div>
                                 <div className="font-semibold text-white mb-1">{c.crime_type}</div>
                                 <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    c.report_category === 'Emergency' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                 }`}>
                                    {c.report_category}
                                 </div>
                              </td>
                              <td className="p-4 align-top min-w-[200px]">
                                 <div className="text-sm text-gray-300 line-clamp-2 mb-2">{c.incident_description}</div>
                                 <div className="text-xs text-gray-500 flex items-center mb-1">
                                    <MapPin className="h-3 w-3 mr-1" /> {c.address || "Location unavailable"}
                                 </div>
                                 <div className="text-xs text-gray-500 flex items-center">
                                    <Users className="h-3 w-3 mr-1" /> By: {c.user_name || 'Anonymous'}
                                 </div>
                              </td>
                              <td className="p-4 align-top hidden md:table-cell max-w-[250px]">
                                 {c.ai_analysis ? (
                                    <div className="bg-white/5 rounded p-2 border border-white/5">
                                      <div className="flex items-center text-xs text-blue-400 font-medium mb-1">
                                        <Bot className="h-3 w-3 mr-1" /> Florence-2 Vision
                                      </div>
                                      <p className="text-xs text-gray-400 line-clamp-3">
                                        {typeof c.ai_analysis === 'string' ? c.ai_analysis : JSON.stringify(c.ai_analysis)}
                                      </p>
                                    </div>
                                 ) : c.evidence_files?.length > 0 || c.evidence_url ? (
                                     <span className="text-xs text-yellow-500/70 italic border border-yellow-500/20 px-2 py-1 rounded bg-yellow-500/5">Analysis Pending</span>
                                 ) : (
                                     <span className="text-xs text-gray-600 italic">No visual evidence provided</span>
                                 )}
                              </td>
                              <td className="p-4 align-top w-48">
                                 <div className="flex flex-col gap-2">
                                     <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border text-center ${getStatusColor(c.status || 'Pending')}`}>
                                        {c.status || "Pending"}
                                     </span>
                                     <select
                                       className="text-xs bg-slate-800 text-white border border-white/10 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                                       value={c.status || "Pending"}
                                       onChange={(e) => handleStatusChange(c.id, c.report_category, e.target.value)}
                                     >
                                        <option value="Pending">Mark Pending</option>
                                        <option value="In Progress">Mark In Progress</option>
                                        <option value="Resolved">Mark Resolved</option>
                                        <option value="Rejected">Mark Rejected</option>
                                     </select>
                                 </div>
                              </td>
                           </tr>
                        ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>

      </div>
    </div>
  );
}