"use client";
import React from "react";
import {
  Shield,
  MapPin,
  BarChart3,
  FileText,
  Eye,
  Map,
  Zap,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const features = [
  {
    icon: Map,
    title: "Crime Heatmap",
    desc: "Visualize crime patterns and hotspots with our interactive heatmap powered by real-time data.",
    href: "/crime_heatmap",
    color: "from-purple-500 to-pink-500",
    bg: "from-purple-900/40 to-pink-900/40",
    border: "border-purple-500/20 hover:border-purple-500/40",
    cta: "Explore Map",
    ctaColor: "text-purple-300",
  },
  {
    icon: Eye,
    title: "Report View",
    desc: "Browse detailed crime reports with filtering options and comprehensive incident information.",
    href: "/user_dashboard",
    color: "from-blue-500 to-cyan-500",
    bg: "from-blue-900/40 to-cyan-900/40",
    border: "border-blue-500/20 hover:border-blue-500/40",
    cta: "View Reports",
    ctaColor: "text-blue-300",
  },
  {
    icon: MapPin,
    title: "Case Tracking",
    desc: "Track the status of reported cases and receive updates on investigation progress.",
    href: "/user_dashboard",
    color: "from-emerald-500 to-teal-500",
    bg: "from-emerald-900/40 to-teal-900/40",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    cta: "Track Cases",
    ctaColor: "text-emerald-300",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Access comprehensive analytics, trends, and insights about crime patterns in your area.",
    href: "/user_dashboard",
    color: "from-orange-500 to-red-500",
    bg: "from-orange-900/40 to-red-900/40",
    border: "border-orange-500/20 hover:border-orange-500/40",
    cta: "View Dashboard",
    ctaColor: "text-orange-300",
  },
  {
    icon: FileText,
    title: "Report Crime",
    desc: "Quickly and securely report crimes with our streamlined form designed for urgent situations.",
    href: "/report_crime",
    color: "from-indigo-500 to-purple-500",
    bg: "from-indigo-900/40 to-purple-900/40",
    border: "border-indigo-500/20 hover:border-indigo-500/40",
    cta: "File Report",
    ctaColor: "text-indigo-300",
  },
  {
    icon: AlertTriangle,
    title: "Emergency Alert",
    desc: "Immediate emergency reporting with direct connection to local law enforcement agencies.",
    href: "/emergency_alert",
    color: "from-red-500 to-pink-500",
    bg: "from-red-900/40 to-pink-900/40",
    border: "border-red-500/20 hover:border-red-500/40",
    cta: "Emergency Report",
    ctaColor: "text-red-300",
  },
];

const stats = [
  { value: "24/7", label: "Real-Time Monitoring" },
  { value: "15,847", label: "Reports Processed" },
  { value: "98%", label: "Response Rate" },
];

export default function CrimeReportingHomepage() {
  return (
    <div className="min-h-screen">
      <Navbar transparent />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-20">
        {/* Background decorations */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-8">
              <Zap className="h-4 w-4 text-red-400 mr-2" />
              <span className="text-red-300 text-sm font-medium">
                Real-Time Crime Reporting
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Stay Safe,
              </span>
              <br />
              <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Stay Informed
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Report crimes instantly, track incidents in real-time, and help
              build safer communities through our advanced crime mapping and
              reporting platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/report_crime">
                <button className="group bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl shadow-red-500/20 hover:shadow-red-500/30">
                  Report Crime Now
                  <ChevronRight className="inline-block ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/crime_heatmap">
                <button className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/15 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300">
                  View Live Map
                  <Map className="inline-block ml-2 h-5 w-5" />
                </button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="glass-card p-6 text-center"
                >
                  <div className="text-3xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Platform Features
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Access powerful tools designed to enhance community safety and crime
            prevention
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.title} href={feature.href} className="block group">
                <div
                  className={`bg-gradient-to-br ${feature.bg} backdrop-blur-sm border ${feature.border} rounded-2xl p-8 transition-all duration-300 transform hover:-translate-y-1 h-full`}
                >
                  <div
                    className={`bg-gradient-to-r ${feature.color} p-3 rounded-xl w-fit mb-6 shadow-lg`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300/80 mb-6 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                  <span
                    className={`${feature.ctaColor} hover:text-white font-medium text-sm flex items-center`}
                  >
                    {feature.cta}
                    <ChevronRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-red-600/10 to-orange-600/10 backdrop-blur-sm border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Make Your Community Safer?
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of citizens helping to create safer neighborhoods
              through real-time crime reporting and community awareness.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/20">
                  Get Started Today
                  <ArrowRight className="inline-block ml-2 h-5 w-5" />
                </button>
              </Link>
              <Link href="/crime_heatmap">
                <button className="bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/15 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200">
                  Explore the Map
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">SafeWatch</span>
              </div>
              <p className="text-gray-500 text-sm max-w-md leading-relaxed">
                Empowering communities through real-time crime reporting and
                advanced safety analytics.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                Platform
              </h3>
              <div className="space-y-2.5">
                <Link href="/report_crime" className="block text-gray-500 hover:text-white transition-colors text-sm">Crime Form</Link>
                <Link href="/user_dashboard" className="block text-gray-500 hover:text-white transition-colors text-sm">Dashboard</Link>
                <Link href="/crime_heatmap" className="block text-gray-500 hover:text-white transition-colors text-sm">Heatmap</Link>
                <Link href="/emergency_alert" className="block text-gray-500 hover:text-white transition-colors text-sm">Emergency</Link>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                Support
              </h3>
              <div className="space-y-2.5">
                <a href="#" className="block text-gray-500 hover:text-white transition-colors text-sm">Help Center</a>
                <a href="#" className="block text-gray-500 hover:text-white transition-colors text-sm">Contact Us</a>
                <a href="#" className="block text-gray-500 hover:text-white transition-colors text-sm">Privacy Policy</a>
                <a href="#" className="block text-gray-500 hover:text-white transition-colors text-sm">Terms of Service</a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 mt-10 pt-8 text-center">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} SafeWatch. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
