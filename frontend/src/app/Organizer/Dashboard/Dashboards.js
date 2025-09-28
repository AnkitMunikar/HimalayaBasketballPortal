'use client';
import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Edit,
  Trash2,
  Plus,
  Eye,
  X,
} from "lucide-react";

const API_BASE = "http://localhost:8000/api";

const OrganizerDashboard = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/organizer/events/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      console.log("Fetched events:", data); // Debug: Log fetched events
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
      alert("Failed to fetch events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamsForEvent = async (eventId) => {
    try {
      const res = await fetch(`${API_BASE}/enroll/events/${eventId}/teams/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      console.log("Fetched teams for event", eventId, ":", data); // Debug: Log teams
      setSelectedEvent((prev) => ({ ...prev, teams: data }));
    } catch (error) {
      console.error("Error fetching teams:", error);
      alert("Failed to fetch teams. Please try again.");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    setLoading(true);
    try {
      console.log("Deleting event with ID:", eventId); // Debug: Log eventId
      const res = await fetch(`${API_BASE}/events/${eventId}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      console.log("Delete response status:", res.status); // Debug: Log response status
      if (res.ok) {
        alert("Event deleted successfully!");
        fetchEvents();
      } else {
        let errorMessage = "Failed to delete event.";
        if (res.status === 403) {
          errorMessage = "You are not authorized to delete this event.";
        } else if (res.status === 404) {
          errorMessage = "Event not found. It may have already been deleted or does not exist.";
        } else if (res.status !== 204) {
          try {
            const errorData = await res.json();
            errorMessage = errorData.detail || JSON.stringify(errorData);
          } catch (jsonError) {
            console.error("Error parsing error response:", jsonError);
          }
        }
        alert(`Failed to delete event: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Error deleting event: Network or server issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setShowTeamForm(true);
  };

  const handleDeleteTeam = async (eventId, teamId) => {
    if (!window.confirm("Remove this team from event?")) return;
    try {
      const res = await fetch(`${API_BASE}/enroll/teams/${teamId}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        alert("Team removed!");
        fetchTeamsForEvent(eventId);
      } else {
        const errorData = await res.json();
        alert(`Failed to remove team: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error("Error deleting team:", error);
      alert("Error removing team. Please try again.");
    }
  };

  const EventForm = ({ event, onClose }) => {
    const [formData, setFormData] = useState({
      name: event?.name || "",
      date: event?.date || "",
      venue: event?.venue || "",
      city: event?.city || "",
      gender: event?.gender || "Boys",
      level: event?.level || "Open",
      duration_type: event?.duration_type || "Tournament",
      payment: event?.payment || "Free",
      description: event?.description || "",
      organizer: event?.organizer || localStorage.getItem("user_id"), // Include organizer ID
    });

    const handleSubmit = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
          throw new Error("User ID not found in localStorage.");
        }
        const url = event?.id
          ? `${API_BASE}/events/${event.id}/`
          : `${API_BASE}/events/create/`;
        const method = event?.id ? "PUT" : "POST";
        console.log("Submitting event:", { ...formData, organizer: userId }); // Debug: Log payload
        const res = await fetch(url, {
          method,
          headers: getAuthHeaders(),
          body: JSON.stringify({ ...formData, organizer: userId }),
        });
        if (res.ok) {
          alert(event?.id ? "Event updated!" : "Event created!");
          onClose();
          fetchEvents();
        } else {
          const errorData = await res.json();
          alert(`Failed to ${event?.id ? "update" : "create"} event: ${JSON.stringify(errorData)}`);
        }
      } catch (error) {
        console.error("Error submitting event:", error);
        alert(`Error submitting event: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-bold">{event?.id ? "Edit Event" : "Create Event"}</h3>
            <button onClick={onClose}><X /></button>
          </div>
          <div className="space-y-3">
            <input
              className="w-full p-2 border rounded"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Event Name"
            />
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
            <input
              className="w-full p-2 border rounded"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="Venue"
            />
            <input
              className="w-full p-2 border rounded"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City"
            />
            <select
              className="w-full p-2 border rounded"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="Boys">Boys</option>
              <option value="Girls">Girls</option>
              <option value="Boys and Girls">Boys and Girls</option>
            </select>
            <input
              className="w-full p-2 border rounded"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              placeholder="Level (e.g., Under 14)"
            />
            <select
              className="w-full p-2 border rounded"
              value={formData.duration_type}
              onChange={(e) => setFormData({ ...formData, duration_type: e.target.value })}
            >
              <option value="Tournament">Tournament</option>
              <option value="League">League</option>
            </select>
            <input
              className="w-full p-2 border rounded"
              value={formData.payment}
              onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
              placeholder="Payment (e.g., Free or amount in NRs)"
            />
            <textarea
              className="w-full p-2 border rounded"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TeamForm = ({ team, eventId, onClose }) => {
    const [formData, setFormData] = useState({
      team_name: team?.team_name || "",
      coach_name: team?.coach_name || "",
      contact_number: team?.contact_number || "",
      email: team?.email || "",
      gender: team?.gender || "Boys",
    });

    const handleSubmit = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/enroll/teams/${team.id}/`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          alert("Team updated!");
          onClose();
          fetchTeamsForEvent(eventId);
        } else {
          const errorData = await res.json();
          alert(`Failed to update team: ${JSON.stringify(errorData)}`);
        }
      } catch (error) {
        console.error("Error updating team:", error);
        alert("Error updating team. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-bold">Edit Team</h3>
            <button onClick={onClose}><X /></button>
          </div>
          <div className="space-y-3">
            <input
              className="w-full p-2 border rounded"
              value={formData.team_name}
              onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
              placeholder="Team Name"
            />
            <input
              className="w-full p-2 border rounded"
              value={formData.coach_name}
              onChange={(e) => setFormData({ ...formData, coach_name: e.target.value })}
              placeholder="Coach Name"
            />
            <input
              className="w-full p-2 border rounded"
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              placeholder="Contact Number"
            />
            <input
              className="w-full p-2 border rounded"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email"
            />
            <select
              className="w-full p-2 border rounded"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="Boys">Boys</option>
              <option value="Girls">Girls</option>
              <option value="Boys and Girls">Boys and Girls</option>
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TeamsModal = ({ event, onClose }) => {
    console.log("Teams data:", event.teams);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-bold">{event.name} - Teams</h3>
            <button onClick={onClose}><X /></button>
          </div>
          {event.teams && event.teams.length > 0 ? (
            <div className="space-y-3">
              {event.teams.map((team) => (
                <div
                  key={team.id}
                  className="flex justify-between items-center border p-3 rounded"
                >
                  <div>
                    <p className="font-semibold">{team.team_name}</p>
                    <p className="text-sm text-gray-500">Coach: {team.coach_name}</p>
                    <p className="text-sm text-gray-500">Gender: {team.gender}</p>
                    <p className="text-sm text-gray-500">Players: {team.players_count}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTeam(team)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      <Edit className="inline w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(event.id, team.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      <Trash2 className="inline w-4 h-4 mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No teams enrolled yet.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Organizer Dashboard</h1>
      {loading && (
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      <button
        onClick={() => {
          setEditingEvent(null);
          setShowEventForm(true);
        }}
        className="mb-6 bg-green-600 text-white py-2 px-4 rounded flex items-center"
      >
        <Plus className="inline w-4 h-4 mr-1" />
        Create New Event
      </button>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.length === 0 && !loading ? (
          <p className="text-gray-500">No events found.</p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-white border rounded-lg p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold mb-2">{event.name}</h3>
              <p className="text-sm text-gray-600 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                {formatDate(event.date)}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <MapPin className="inline w-4 h-4 mr-1" />
                {event.venue}, {event.city}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <Users className="inline w-4 h-4 mr-1" />
                {event.gender}, {event.level}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                <DollarSign className="inline w-4 h-4 mr-1" />
                Payment: {event.payment}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedEvent(event);
                    fetchTeamsForEvent(event.id);
                    setShowTeamsModal(true);
                  }}
                  className="flex-1 bg-indigo-500 text-white py-1 rounded"
                >
                  <Eye className="inline w-4 h-4 mr-1" />
                  View Teams
                </button>
                <button
                  onClick={() => handleEditEvent(event)}
                  className="flex-1 bg-blue-500 text-white py-1 rounded"
                >
                  <Edit className="inline w-4 h-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="flex-1 bg-red-500 text-white py-1 rounded"
                >
                  <Trash2 className="inline w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showEventForm && (
        <EventForm
          event={editingEvent}
          onClose={() => setShowEventForm(false)}
        />
      )}
      {showTeamsModal && selectedEvent && (
        <TeamsModal
          event={selectedEvent}
          onClose={() => setShowTeamsModal(false)}
        />
      )}
      {showTeamForm && editingTeam && (
        <TeamForm
          team={editingTeam}
          eventId={selectedEvent?.id}
          onClose={() => setShowTeamForm(false)}
        />
      )}
    </div>
  );
};

export default OrganizerDashboard;