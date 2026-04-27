'use client';
import { useRef } from "react";
import Header from "@/components/Header";
import HideScoresToggle from "@/components/HideScoresToggle";
import DisplayForm from "@/components/DisplayForm";
import Footer from "@/components/Footer";

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
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-2 sm:px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl font-fjalla-one text-white leading-tight">
              Welcome to the Himalaya Basketball Portal
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-fjalla-one text-white mt-2 sm:mt-4 max-w-2xl px-2">
              Find your favorite tournaments and events
            </p>

            {/* Click to Scroll */}
            <div
              onClick={handleEventsClick}
              className="mt-4 sm:mt-8 cursor-pointer border-2 border-amber-50 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base lg:text-lg font-semibold hover:bg-purple-800 hover:text-white transition-all duration-300 w-full sm:w-auto text-center"
            >
              Events
            </div>
          </div>
        </div>
      </section>

      {/* Slogan & Value Section */}
      <section className="relative py-14 sm:py-20 md:py-24 px-4 sm:px-6 overflow-hidden">
        {/* Background: gradient + subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative max-w-5xl mx-auto">
          {/* Slogan block with accent */}
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-purple-600 font-semibold mb-3">
              Our mission
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-fjalla-one text-slate-900 tracking-tight">
              Grow the Game.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-amber-500">
                Together.
              </span>
            </h2>
            <div className="flex justify-center mt-4">
              <div className="h-1 w-20 rounded-full bg-gradient-to-r from-purple-500 to-amber-400" />
            </div>
          </div>

          
        </div>
      </section>

      {/* Display Form Section (Scroll Target) - Events button scrolls here */}
      <div ref={displayFormRef} className="scroll-mt-20">
        <DisplayForm />
      </div>
      <Footer/>
    </main>
  );
}