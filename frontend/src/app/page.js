'use client'
import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import HideScoresToggle from "@/components/HideScoresToggle";
import DisplayForm from "@/components/DisplayForm";

export default function HomePage() {
  const buyTicketsRef = useRef(null);

  return (
    <main className="min-h-screen flex flex-col">
      <Header />

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
          <div className="relative z-10 flex flex-col items-center justify-center text-center h-full">
  <h2 className="text-5xl md:text-7xl font-fjalla-one text-white">
    Welcome to the Himalaya Basketball Portal
  </h2>
  <p className="text-lg md:text-2xl font-fjalla-one text-white mt-4">
    Find your favorite tournaments and events
  </p>
  <div className="mt-8">
    <a
      href="/Organize"
      className="border-amber-50 border-2 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-auto transition-colors"
    >
      Events
    </a>
  </div>
</div>

        </div>
      </section>

      <div className="flex flex-col px-4 md:px-12 py-6 space-y-10 pt-18">
        <HideScoresToggle />
      </div>
      <div className="flex flex-col px-4 md:px-12 py-6 space-y-10 pt-18">
        <DisplayForm />
      </div>
    </main>
  );
}
