'use client';
import { useRef } from "react";
import Header from "@/components/Header";
import HideScoresToggle from "@/components/HideScoresToggle";
import DisplayForm from "@/components/DisplayForm";

export default function HomePage() {
  const displayFormRef = useRef(null);

  const handleEventsClick = () => {
    if (displayFormRef.current) {
      displayFormRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section>
        <div className="relative h-[calc(100vh-60px)] mt-[60px] flex items-center justify-center overflow-hidden">
          {/* Video Background */}
          <video
            src="vidbasketball.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          ></video>

          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80"></div>

          {/* Centered Text */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-fjalla-one text-white leading-tight">
              Welcome to the Himalaya Basketball Portal
            </h2>
            <p className="text-base sm:text-lg md:text-2xl font-fjalla-one text-white mt-4 max-w-2xl">
              Find your favorite tournaments and events
            </p>

            {/* Click to Scroll */}
            <div
              onClick={handleEventsClick}
              className="mt-8 cursor-pointer border-2 border-amber-50 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-amber-500 hover:text-black transition-all duration-300 w-full sm:w-auto text-center"
            >
              Events
            </div>
          </div>
        </div>
      </section>


      {/* Display Form Section (Scroll Target) */}
      <div>
        <DisplayForm />
      </div>
    </main>
  );
}