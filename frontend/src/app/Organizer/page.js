'use client';
import { useRef } from "react";
import Header from "@/components/Header";

import OrganizerDashboard from "./Dashboard/OrganizerDashboard";

export default function Organizer() {
  const displayFormRef = useRef(null);

  const handleEventsClick = () => {
    if (displayFormRef.current) {
      displayFormRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Display Form Section (Scroll Target) */}
      <div>
        <OrganizerDashboard/>
      </div>
    </main>
  );
}