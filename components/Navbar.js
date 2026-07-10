"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Shield,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/report_crime", label: "Report Crime" },
  { href: "/emergency_alert", label: "Emergency" },
  { href: "/crime_heatmap", label: "Heatmap" },
  { href: "/user_dashboard", label: "Dashboard" },
];

export default function Navbar({ transparent = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData && userData.isLoggedIn) {
        setUser(userData);
      }
    } catch {
      // invalid JSON in localStorage
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("user");
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    setUser(null);
    router.push("/login");
  };

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navBg = scrolled || !transparent
    ? "bg-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/10"
    : "bg-transparent";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2 rounded-xl shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow duration-300">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              SafeWatch
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-white/90">
                    {user.username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                >
                  Login
                </Link>
                <Link
                  href="/admin_login"
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20"
                >
                  Admin
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden animate-slide-down pb-4 border-t border-white/5 mt-2 pt-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-white/5 mt-2 pt-2">
                {user ? (
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium text-white/90">
                        {user.username}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-red-400 hover:text-red-300 font-medium"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/login"
                      className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white rounded-lg hover:bg-white/5"
                    >
                      Login
                    </Link>
                    <Link
                      href="/admin_login"
                      className="px-4 py-2.5 text-sm font-medium text-blue-400 hover:text-blue-300 rounded-lg hover:bg-blue-500/5"
                    >
                      Admin Login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
