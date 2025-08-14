'use client';
import React, { useState } from "react";
import Link from "next/link";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-[#2e0052] text-white px-4 md:px-12 py-4 flex items-center justify-between z-50 shadow-md">
      
      {/* Left section: Hamburger (mobile) + Nav Links */}
      <div className="flex items-center space-x-4">
        {/* Hamburger Menu Button for Mobile */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden focus:outline-none"
        >
          {isMenuOpen ? <XMarkIcon className="h-7 w-7" /> : <Bars3Icon className="h-7 w-7" />}
        </button>

        {/* Nav Links (hidden on mobile) */}
        <ul className="hidden md:flex space-x-6 text-white font-medium">
          <li><Link href="/" className="hover:text-blue-400">Home</Link></li>
          <li><Link href="/Schedule" className="hover:text-blue-400">Schedule</Link></li>
          <li><Link href="/Stats" className="hover:text-blue-400">Stats</Link></li>
          <li><Link href="/Organize" className="hover:text-blue-400">Organize</Link></li>
          <li><Link href="/Ticket" className="hover:text-blue-400">Ticket</Link></li>
        </ul>
      </div>

      {/* Logo - centered and overflowing */}
      {/* Logo - centered and overflowing */}
<div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 z-10">
  <img
    src="logohim.png"
    alt="Logo"
    className="h-28 w-auto object-contain drop-shadow-lg"
  />
</div>


      {/* Right section: Search + Signup */}
      <div className="hidden sm:flex items-center space-x-4">
        <Link href="/signup">
          <button className="bg-violet-800 p-2 px-3 rounded-3xl text-m hover:bg-blue-500">
            Sign up
          </button>
        </Link>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[#2e0052] shadow-md md:hidden">
          <ul className="flex flex-col space-y-4 p-4 text-white font-medium">
            <li><Link href="/" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
            <li><Link href="/Schedule" onClick={() => setIsMenuOpen(false)}>Schedule</Link></li>
            <li><Link href="/Stats" onClick={() => setIsMenuOpen(false)}>Stats</Link></li>
            <li><Link href="/Organize" onClick={() => setIsMenuOpen(false)}>Organize</Link></li>
            <li><Link href="/Ticket" onClick={() => setIsMenuOpen(false)}>Ticket</Link></li>
            <li><Link href="/signup" onClick={() => setIsMenuOpen(false)}>Sign up</Link></li>
          </ul>
        </div>
      )}
    </nav>
  );
}
