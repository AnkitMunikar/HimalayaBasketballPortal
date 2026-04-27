import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '../components/AuthContext';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Himalaya Basketball Portal",
  description: "Manage basketball tournaments and team enrollments in Nepal. Find events, register teams, and connect with organizers, coaches, and players.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
         <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
