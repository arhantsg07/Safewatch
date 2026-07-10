"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Loader2, Home } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function AdminLogin() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/admin-signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        // Set JWT token in cookie for middleware to read
        document.cookie = `admin_token=${data.token}; path=/;`;
        
        toast.success("Admin access granted.");
        router.push("/admin_dashboard");
      } else {
        toast.error("Invalid administrator credentials.");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      toast.error("Connection failed. Check server status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative p-4">
      {/* Background decoration */}
      <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
      
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <Home className="h-5 w-5" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="w-full max-w-md z-10 animate-slide-up">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mb-4">
              <ShieldCheck className="h-8 w-8 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-gray-400 text-sm">Restricted access area for authorized personnel only.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Administrator Username
              </label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter admin ID"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Security Password
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter secure password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all mt-6"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Authenticate
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
