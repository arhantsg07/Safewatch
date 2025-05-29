"use client"
import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  MapPin, 
  BarChart3, 
  FileText, 
  Eye, 
  Map,
  Zap,
  Users,
  Clock,
  AlertTriangle,
  ChevronRight,
  Menu,
  X,
  ShieldUser,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CrimeReportingHomepage = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData && userData.isLoggedIn) {
      setUser(userData);
    }
  }, []);

  const handleLogout = () => {
    // Clear stored user info
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("user"); // Clear additional user data if stored
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

    console.log("Debugging: Cleared user_id and username from localStorage"); // Debugging

    // Redirect to login page (or homepage)
    router.push("/login"); 
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
      {/* Navbar */}
      <nav className="relative z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                SafeWatch
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-white/80 hover:text-white transition-colors duration-200 font-medium">
                Home
              </a>
              <Link href="/report_crime" className="text-white/80 hover:text-white transition-colors duration-200 font-medium">
                Crime Form
              </Link>
              <a href="#" className="text-white/80 hover:text-white transition-colors duration-200 font-medium">
                Dashboard
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors duration-200 font-medium">
                Reports
              </a>
              
              {user ? (
                    <div className="user-info flex items-center space-x-4 text-white">
                      <div className="flex flex-col items-center">
                        <ShieldUser />
                        <span className="username font-medium tracking-wide">{user.username}</span>
                      </div>
                        <button onClick={handleLogout}>
                          <LogOut className='h-5 w-5 hover:text-red-500 transition-colors'/>
                        </button>
                    </div>
                ): ( <div className="flex items-center space-x-4">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105">
                  <Link href="/login">Login</Link>
                </button>
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105">
                  <Link href="/admin_login">Admin Login</Link>
                </button>
              </div> )}
              
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10">
              <div className="px-4 py-6 space-y-4">
                <a href="#" className="block text-white/80 hover:text-white transition-colors font-medium">
                  Home
                </a>
                <Link href="/report_crime" className="block text-white/80 hover:text-white transition-colors font-medium">
                  Crime Form
                </Link>
                <a href="#" className="block text-white/80 hover:text-white transition-colors font-medium">
                  Dashboard
                </a>
                <a href="#" className="block text-white/80 hover:text-white transition-colors font-medium">
                  Reports
                </a>
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-medium">
                  Login
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-8">
              <Zap className="h-4 w-4 text-red-400 mr-2" />
              <span className="text-red-300 text-sm font-medium">Real-Time Crime Reporting</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Stay Safe,
              </span>
              <br />
              <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Stay Informed
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Report crimes instantly, track incidents in real-time, and help build safer communities 
              through our advanced crime mapping and reporting platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/report_crime">
                <button className="group bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl">
                  Report Crime Now
                  <ChevronRight className="inline-block ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <button className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-200">
                View Live Map
                <Map className="inline-block ml-2 h-5 w-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-gray-400">Real-Time Monitoring</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="text-3xl font-bold text-white">15,847</div>
                <div className="text-gray-400">Reports Processed</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="text-gray-400">Response Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Platform Features</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Access powerful tools designed to enhance community safety and crime prevention
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Heatmap */}
          <div className="group bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/40 transition-all duration-300 transform hover:-translate-y-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl w-fit mb-6">
              <Map className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Crime Heatmap</h3>
            <p className="text-gray-300 mb-6">
              Visualize crime patterns and hotspots with our interactive heatmap powered by real-time data.
            </p>
            <button className="group text-purple-300 hover:text-white font-medium flex items-center">
              Explore Map
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Report View */}
          <div className="group bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 hover:border-blue-500/40 transition-all duration-300 transform hover:-translate-y-2">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl w-fit mb-6">
              <Eye className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Report View</h3>
            <p className="text-gray-300 mb-6">
              Browse detailed crime reports with filtering options and comprehensive incident information.
            </p>
            <button className="group text-blue-300 hover:text-white font-medium flex items-center">
              View Reports
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Tracking Page */}
          <div className="group bg-gradient-to-br from-green-900/50 to-teal-900/50 backdrop-blur-sm border border-green-500/20 rounded-2xl p-8 hover:border-green-500/40 transition-all duration-300 transform hover:-translate-y-2">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-xl w-fit mb-6">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Case Tracking</h3>
            <p className="text-gray-300 mb-6">
              Track the status of reported cases and receive updates on investigation progress.
            </p>
            <button className="group text-green-300 hover:text-white font-medium flex items-center">
              Track Cases
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Dashboard */}
          <div className="group bg-gradient-to-br from-orange-900/50 to-red-900/50 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-8 hover:border-orange-500/40 transition-all duration-300 transform hover:-translate-y-2">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl w-fit mb-6">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Analytics Dashboard</h3>
            <p className="text-gray-300 mb-6">
              Access comprehensive analytics, trends, and insights about crime patterns in your area.
            </p>
            
            <Link href="/user_dashboard">
            <button className="group text-orange-300 hover:text-white font-medium flex items-center">
              View Dashboard
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            </Link>
          </div>

          {/* Crime Form */}
          <div className="group bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-8 hover:border-indigo-500/40 transition-all duration-300 transform hover:-translate-y-2">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl w-fit mb-6">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Report Crime</h3>
            <p className="text-gray-300 mb-6">
              Quickly and securely report crimes with our streamlined form designed for urgent situations.
            </p>
            <Link href="/report_crime">
              <button className="group text-indigo-300 hover:text-white font-medium flex items-center">
                File Report
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          {/* Emergency */}
          <div className="group bg-gradient-to-br from-red-900/50 to-pink-900/50 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 hover:border-red-500/40 transition-all duration-300 transform hover:-translate-y-2">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-3 rounded-xl w-fit mb-6">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Emergency Alert</h3>
            <p className="text-gray-300 mb-6">
              Immediate emergency reporting with direct connection to local law enforcement agencies.
            </p>
            <Link href="/emergency_alert">
            <button className="group text-red-300 hover:text-white font-medium flex items-center">
              Emergency Report
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 backdrop-blur-sm border-y border-red-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Make Your Community Safer?</h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of citizens helping to create safer neighborhoods through real-time crime reporting and community awareness.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-200 transform hover:scale-105">
                Get Started Today
              </button>
              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-200">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="text-xl font-bold text-white">SafeWatch</div>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering communities through real-time crime reporting and advanced safety analytics.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Crime Form</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Dashboard</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Heatmap</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Reports</a>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Help Center</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Contact Us</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-gray-400">© 2025 SafeWatch. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CrimeReportingHomepage;
