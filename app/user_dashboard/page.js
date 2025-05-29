"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = "https://pibltfngauqztjsfqzcv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpYmx0Zm5nYXVxenRqc2ZxemN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODE0NjcsImV4cCI6MjA2Mzg1NzQ2N30.8Kug8-huMJnA0aB8x2oyrSl6B3Nv257PrHFtaHTC9-s";
const supabase = createClient(supabaseUrl, supabaseKey);

const UserDashboardPage = () => {
  const router = useRouter();
  const [complaints, setComplaints] = useState([]);
  const [userId, setUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (!storedUserId) {
      alert("Unauthorized access. Redirecting to login.");
      router.push("/login");
    } else {
      setUserId(storedUserId);
      fetchUserComplaints(storedUserId);
    }
    // eslint-disable-next-line
  }, [router]);

  const fetchUserComplaints = async (userId) => {
    try {
      const [crimeReportsRes, emergencyReportsRes] = await Promise.all([
        supabase
          .from("crime_report")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("crime_emergency_report")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (crimeReportsRes.error) throw crimeReportsRes.error;
      if (emergencyReportsRes.error) throw emergencyReportsRes.error;

      const crimeReports = crimeReportsRes.data.map((report) => ({
        id: report.id,
        type: report.crime_type,
        location: report.address,
        status: report.reported_to_police ? "Reported to Police" : "Under Investigation",
        date: new Date(report.created_at).toLocaleDateString(),
        created_at: report.created_at,
        isEmergency: false,
      }));

      const emergencyReports = emergencyReportsRes.data.map((report) => ({
        id: report.uuid,
        type: report.crime_type,
        location: report.description, // Adjust based on your schema
        status: "Emergency Alert",
        date: new Date(report.created_at).toLocaleDateString(),
        created_at: report.created_at,
        isEmergency: true,
      }));

      setComplaints([...crimeReports, ...emergencyReports]);
    } catch (error) {
      console.error("Error fetching user complaints:", error.message);
    }
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      complaint.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus
      ? complaint.status === filterStatus
      : true;
    return matchesSearch && matchesFilter;
  });

  const handleComplaintClick = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.reported_to_police
  ).length;
  const activeComplaints = complaints.length - resolvedComplaints;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 min-h-screen text-white p-8">
      <h1 className="text-4xl font-bold mb-10">My Complaints</h1>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Complaint Progress</h2>

        {/* Search and Filter UI */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search by type or location"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Reported to Police">Reported to Police</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Emergency Alert">Emergency Alert</option>
          </select>
        </div>

        {/* Complaint Statistics */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 p-4 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-white">Total Complaints</h3>
            <p className="text-2xl font-bold text-blue-400">{complaints.length}</p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-white">Resolved Complaints</h3>
            <p className="text-2xl font-bold text-green-400">{resolvedComplaints}</p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-white">Active Complaints</h3>
            <p className="text-2xl font-bold text-yellow-400">{activeComplaints}</p>
          </div>
        </div>

        <Table className="text-white/90">
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Type</TableHead>
              <TableHead className="text-white">Location</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((complaint) => (
                <TableRow
                  key={complaint.id}
                  className="hover:bg-white/10 cursor-pointer"
                  onClick={() => handleComplaintClick(complaint)}
                >
                  <TableCell>{complaint.type}</TableCell>
                  <TableCell>{complaint.location}</TableCell>
                  <TableCell>
                    <Badge variant={complaint.status === "Reported to Police" ? "success" : "warning"}>
                      {complaint.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{complaint.date}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400">
                  No complaints found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Complaint Details</h2>
            <p>
              <strong>Type:</strong> {selectedComplaint.crime_type}
            </p>
            <p>
              <strong>Location:</strong> {selectedComplaint.address}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {selectedComplaint.reported_to_police
                ? "Reported to Police"
                : "Under Investigation"}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(selectedComplaint.created_at).toLocaleDateString()}
            </p>
            <button
              onClick={() => setSelectedComplaint(null)}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboardPage;
