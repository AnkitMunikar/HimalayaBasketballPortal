import React from "react";
import Link from "next/link";

export default function Header() {
  return (
    <nav className="fixed top-0 w-full bg-[#2e0052] text-white px-12 py-4 flex items-center justify-between z-50 shadow-md">
      {/* Left Nav Links */}
      <ul className="flex space-x-6 text-white font-medium">
        <li>
          <Link href="/" className="hover:text-blue-400">Home</Link>
        </li>
        <li>
          <Link href="/Schedule" className="hover:text-blue-400">Schedule</Link>
        </li>
        <li>
          <Link href="/Stats" className="hover:text-blue-400">Stats</Link>
        </li>
        <li>
          <Link href="/Organize" className="hover:text-blue-400">Organize</Link>
        </li>
        <li>
          <Link href="/Ticket" className="hover:text-blue-400">Ticket</Link>
        </li>
      </ul>

      {/* Oversized Center Logo (hanging below navbar) */}
      <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 z-10">
        <img src="logohim.png" alt="Logo" className="h-35 w-auto object-contain drop-shadow-lg" />
      </div>

      {/* Search + Signup */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="pl-4 py-2 bg-neutral-300 rounded-full text-black focus:outline-none w-full"
          />
        </div>
        <Link href="/signup">
          <button className="bg-violet-800 p-2 px-3 rounded-3xl text-m hover:bg-blue-500">
            Sign up
          </button>
        </Link>
      </div>
    </nav>
  );
}
