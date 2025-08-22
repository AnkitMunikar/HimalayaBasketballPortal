"use client";
import { logout } from "@/utils/auth";

export default function PlayerDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Player Dashboard</h1>
      <p>You can view events & see team enrollments.</p>
      <button onClick={logout} className="bg-red-500 text-white p-2 mt-4">Logout</button>
    </div>
  );
}
