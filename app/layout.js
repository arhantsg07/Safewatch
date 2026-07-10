import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "SafeWatch — Community Safety Platform",
  description:
    "Report crimes instantly, track incidents in real-time, and help build safer communities through our advanced crime mapping and reporting platform.",
  keywords: "crime reporting, safety, heatmap, community, emergency alert",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased font-sans`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
