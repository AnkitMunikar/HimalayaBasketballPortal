"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import api from "@/utils/api";
import { useAuth } from "@/components/AuthContext";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  Award,
  ChevronRight,
  LogOut,
  ExternalLink,
} from "lucide-react";

const formatDate = (dateString) => {
  if (!dateString) return "Date TBD";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    return "Invalid date";
  }
};

const isUpcoming = (dateString) => {
  if (!dateString) return false;
  try {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    return !isNaN(eventDate.getTime()) && eventDate > today;
  } catch {
    return false;
  }
};

export default function PlayerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role !== "player") return;
    fetchEvents();
  }, [user?.role]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("player/events/");
      const list = Array.isArray(data) ? data : data?.results ?? data?.data ?? [];
      setEvents(list);
    } catch (err) {
      console.error("Error fetching player events:", err);
      setError(err.response?.data?.detail || err.message || "Failed to load events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (eventId) => {
    router.push(`/DisplayEvents/${eventId}`);
  };

  const handleBrowseAll = () => {
    router.push("/DisplayEvents");
  };

  if (user?.role !== "player") {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="mt-[60px] flex-1 px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
        {/* Welcome & Profile */}
        <section className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold font-fjalla-one text-gray-900 mb-1">
            Player Dashboard
          </h1>
          <p className="text-gray-600">
            Hello{user?.name ? `, ${user.name}` : user?.username ? `, ${user.username}` : ""}! Browse approved events and view details.
          </p>
          <button
            onClick={logout}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </section>

        {/* Browse all events link */}
        <div className="mb-6">
          <button
            onClick={handleBrowseAll}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2e0052] hover:bg-[#4a0072] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Browse all events (public)
          </button>
        </div>

        {/* Approved events for you */}
        <section>
          <h2 className="text-xl font-semibold font-fjalla-one text-gray-900 mb-4">
            Approved events you can view
          </h2>

          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2e0052]"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <p>{error}</p>
              <button
                onClick={fetchEvents}
                className="mt-2 text-sm font-medium underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No approved events right now.</p>
              <p className="text-sm text-gray-500 mt-1">Check back later or browse the public events page.</p>
              <button
                onClick={handleBrowseAll}
                className="mt-4 text-[#2e0052] font-medium hover:underline"
              >
                Browse all events
              </button>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="space-y-3">
              {events.map((event) => {
                const upcoming = isUpcoming(event.date);
                const full = event.is_full ?? false;
                const slots = event.available_slots;
                const current = event.current_enrollment_count ?? 0;
                const maxTeams = event.max_teams ?? 0;

                return (
                  <div
                    key={event.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewDetails(event.id)}
                  >
                    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {event.logo_url ? (
                        <img
                          src={event.logo_url}
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Award className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {event.name || "Unnamed Event"}
                        </h3>
                        {upcoming && !full && (
                          <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                            Upcoming
                          </span>
                        )}
                        {full && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            Full
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {event.organizer_name || "Organizer"}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          {formatDate(event.date)}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                          {event.venue || "TBD"} • {event.city || ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {event.gender || "—"} • {event.level || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-amber-500 font-semibold text-sm">Rs.</span>
                          {event.payment === "Free" || !event.payment
                            ? "Free"
                            : event.payment}
                        </span>
                      </div>
                      {maxTeams > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          <Trophy className="w-3.5 h-3.5 inline mr-1" />
                          {current}/{maxTeams} teams
                          {slots != null && slots > 0 && ` • ${slots} spots left`}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-1 text-[#2e0052] font-medium text-sm">
                        View details
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
