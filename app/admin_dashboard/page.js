'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { createClient } from '@supabase/supabase-js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Initialize Supabase client
const supabaseUrl = "https://pibltfngauqztjsfqzcv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpYmx0Zm5nYXVxenRqc2ZxemN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODE0NjcsImV4cCI6MjA2Mzg1NzQ2N30.8Kug8-huMJnA0aB8x2oyrSl6B3Nv257PrHFtaHTC9-s";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCrimes: 0,
    totalEmergencies: 0,
    resolvedCases: 0,
    activeCases: 0
  });

  const [recentCrimes, setRecentCrimes] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [crimeTrendData, setCrimeTrendData] = useState(null);
  const [crimeTypeData, setCrimeTypeData] = useState(null);
  const [emergencyTypeData, setEmergencyTypeData] = useState(null);

  const fetchCrimeReports = async () => {
    try {
      const [crimeRes, emergencyRes] = await Promise.all([
        supabase.from('crime_report').select('*').order('created_at', { ascending: false }),
        supabase.from('crime_emergency_report').select('*').order('created_at', { ascending: false }),
      ]);
  
      if (crimeRes.error) throw crimeRes.error;
      if (emergencyRes.error) throw emergencyRes.error;
  
      const crimeReports = crimeRes.data.map(report => ({
        id: report.id,
        type: report.crime_type,
        location: report.address,
        status: report.reported_to_police ? 'Reported to Police' : 'Under Investigation',
        date: new Date(report.created_at).toLocaleDateString(),
        created_at: report.created_at,
        isEmergency: false,
      }));
  
      const emergencyReports = emergencyRes.data.map(report => ({
        id: report.uuid,
        type: report.crime_type,
        location: report.description, // or wherever address is stored
        status: 'Emergency Alert',
        date: new Date(report.created_at).toLocaleDateString(),
        created_at: report.created_at,
        isEmergency: true,
      }));
  
      const combinedReports = [...crimeReports, ...emergencyReports];
  
      setRecentCrimes(crimeReports);
      setEmergencyAlerts(emergencyReports);
  
      setStats({
        totalCrimes: crimeReports.length,
        totalEmergencies: emergencyReports.length,
        resolvedCases: crimeReports.filter(r => r.status === 'Reported to Police').length,
        activeCases: crimeReports.filter(r => r.status === 'Under Investigation').length
      });
  
      processChartData(combinedReports);
    } catch (error) {
      console.error('Error fetching reports:', error.message);
    }
  };

  const processChartData = (reports) => {
    console.log('Raw reports data from Supabase:', reports);
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString('default', { month: 'short' });
    }).reverse();

    const crimeTrendData = {
      labels: last6Months,
      datasets: [{
        label: 'Crime Reports',
        data: last6Months.map(month =>
          reports.filter(report =>
            new Date(report.created_at).toLocaleString('default', { month: 'short' }) === month
          ).length
        ),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
      }],
    };

    const crimeTypes = [...new Set(reports.map(r => r.type))];
    const crimeTypeData = {
      labels: crimeTypes,
      datasets: [{
        data: crimeTypes.map(type =>
          reports.filter(r => r.type === type).length
        ),
        backgroundColor: ['#0ea5e9', '#9333ea', '#facc15', '#ef4444', '#10b981'],
      }],
    };

    const emergencyReports = reports.filter(r => r.isEmergency);
    const emergencyTypes = [...new Set(emergencyReports.map(r => r.type))];
    const emergencyTypeData = {
      labels: emergencyTypes,
      datasets: [{
        label: 'Emergency Alerts',
        data: emergencyTypes.map(type =>
          emergencyReports.filter(r => r.type === type).length
        ),
        backgroundColor: emergencyTypes.map((_, i) =>
          ['#f87171', '#60a5fa', '#facc15', '#34d399', '#a78bfa'][i % 5]
        ),
      }],
    };

    setCrimeTrendData(crimeTrendData);
    setCrimeTypeData(crimeTypeData);
    setEmergencyTypeData(emergencyTypeData);

    console.log('Emergency Reports:', emergencyReports);
    console.log('Emergency Type Chart Data:', emergencyTypeData);
  };

  useEffect(() => {
    fetchCrimeReports();

    const subscription = supabase
      .channel('crime_reports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crime_report' }, () => {
        fetchCrimeReports();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 min-h-screen text-white p-8">
      <h1 className="text-4xl font-bold mb-10">Crime Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { title: "Total Crime Reports", value: stats.totalCrimes },
          { title: "Emergency Alerts", value: stats.totalEmergencies },
          { title: "Resolved Cases", value: stats.resolvedCases },
          { title: "Active Cases", value: stats.activeCases },
        ].map((item, idx) => (
          <Card key={idx} className="bg-white/10 backdrop-blur-sm border border-white/10 shadow-xl rounded-2xl p-4 hover:scale-[1.01] transition-transform duration-300">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-white/70">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Card className="bg-white/10 backdrop-blur-sm border border-white/10 shadow-xl rounded-2xl p-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white/80">Crime Reports Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            {crimeTrendData && <Line data={crimeTrendData} options={{
              maintainAspectRatio: false,
              scales: {
                x: {
                  ticks: { color: 'white' },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                },
                y: {
                  ticks: { color: 'white' },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                },
              },
              plugins: {
                legend: {
                  labels: {
                    color: 'white',
                  },
                },
              },
            }} />}
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border border-white/10 shadow-xl rounded-2xl p-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white/80">Crime Type Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            {crimeTypeData && <Pie data={crimeTypeData} options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: {
                    color: 'white',
                  },
                },
              },
            }} />}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-white/10 backdrop-blur-sm border border-white/10 shadow-xl rounded-2xl p-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white/80">Emergency Alerts by Type</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {emergencyTypeData && <Bar data={emergencyTypeData} options={{
              maintainAspectRatio: false,
              scales: {
                x: {
                  ticks: { color: 'white' },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                },
                y: {
                  ticks: { color: 'white' },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                },
              },
              plugins: {
                legend: {
                  labels: {
                    color: 'white',
                  },
                },
              },
            }} />}
          </CardContent>
        </Card>
      </div>

      {/* Recent Crime Reports */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Recent Crime Reports</h2>
        <Card className="bg-white/10 backdrop-blur-sm border border-white/10 shadow-xl rounded-2xl">
          <CardContent className="p-4">
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
                {recentCrimes.map(crime => (
                  <TableRow key={crime.id} className="hover:bg-white/10">
                    <TableCell>{crime.type}</TableCell>
                    <TableCell>{crime.location}</TableCell>
                    <TableCell>
                      <Badge variant={crime.status === 'Reported to Police' ? 'success' : 'warning'}>
                        {crime.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{crime.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Emergency Alerts */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Emergency Alerts</h2>
        <Card className="bg-white/10 backdrop-blur-sm border border-white/10 shadow-xl rounded-2xl">
          <CardContent className="p-4">
            <Table className="text-white/90">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Type</TableHead>
                  <TableHead className="text-white">Location</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emergencyAlerts.map(alert => (
                  <TableRow key={alert.id} className="hover:bg-white/10">
                    <TableCell>{alert.type}</TableCell>
                    <TableCell>{alert.location}</TableCell>
                    <TableCell>
                      <Badge variant={alert.status === 'Reported to Police' ? 'success' : 'destructive'}>
                        {alert.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{alert.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
