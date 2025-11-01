// OrganizerDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  X,
  Upload,
  FileText,
  Paperclip,
  AlertCircle,
  Loader,
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

  /* ---------- AUTH HELPERS ---------- */
  const getUserId = () => {
    const raw = localStorage.getItem("user_data");
    if (!raw) return null;
    try { return JSON.parse(raw)?.id; }
    catch { return null; }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const getAuthHeadersMultipart = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /* ---------- FETCH ---------- */
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events/organizer/events/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamsForEvent = async (eventId) => {
    try {
      const res = await fetch(`${API_BASE}/enroll/events/${eventId}/teams/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSelectedEvent((prev) => ({ ...prev, teams: data }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  /* ---------- DATE HELPERS ---------- */
  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  /** Compare **full day** – event is Past if its date < today (ignoring time) */
  const getEventStatus = (dateStr) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today ? "Past" : "Upcoming";
  };

  /* ---------- EVENT ACTIONS ---------- */
  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Delete this event?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok || res.status === 204) {
        alert("Event deleted!");
        fetchEvents();
      } else alert("Failed to delete.");
    } catch (e) {
      console.error(e);
      alert("Error deleting event.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- TEAM ACTIONS ---------- */
  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setShowTeamForm(true);
  };

  const handleDeleteTeam = async (eventId, teamId) => {
    if (!window.confirm("Remove team from event?")) return;
    try {
      const res = await fetch(`${API_BASE}/enroll/teams/${teamId}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        alert("Team removed!");
        fetchTeamsForEvent(eventId);
      }
    } catch (e) {
      console.error(e);
      alert("Error removing team.");
    }
  };

  /* ---------- EVENT FORM (inline edit) ---------- */
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
    });

    const [files, setFiles] = useState({ logo: null, receipt: null });
    const [previews, setPreviews] = useState({ logo: null, receipt: null });
    const [formError, setFormError] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    const handleFileChange = (e, type) => {
      const file = e.target.files[0];
      if (!file) return;

      if (type === "logo") {
        const ok = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp", "image/svg+xml"].includes(file.type);
        if (!ok) return setFormError("Logo must be an image");
        if (file.size > 5 * 1024 * 1024) return setFormError("Logo ≤ 5 MB");
      } else {
        if (file.type !== "application/pdf") return setFormError("Receipt must be PDF");
        if (file.size > 10 * 1024 * 1024) return setFormError("Receipt ≤ 10 MB");
      }

      setFiles((p) => ({ ...p, [type]: file }));
      if (type === "logo") {
        const reader = new FileReader();
        reader.onloadend = () => setPreviews((p) => ({ ...p, logo: reader.result }));
        reader.readAsDataURL(file);
      } else {
        setPreviews((p) => ({ ...p, receipt: file.name }));
      }
      setFormError("");
    };

    const removeFile = (type) => {
      setFiles((p) => ({ ...p, [type]: null }));
      setPreviews((p) => ({ ...p, [type]: null }));
    };

    const handleSubmit = async () => {
      setFormLoading(true);
      setFormError("");
      try {
        const organizerId = getUserId();
        if (!organizerId) throw new Error("Not authenticated");

        const url = event?.id
          ? `${API_BASE}/events/${event.id}/`
          : `${API_BASE}/events/create/`;
        const method = event?.id ? "PATCH" : "POST";

        const payload = { ...formData, organizer: organizerId };
        const res = await fetch(url, {
          method,
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed");

        const createdId = data.id;

        // ---------- FILE UPLOAD ----------
        if (files.logo || files.receipt) {
          const fd = new FormData();
          if (files.logo) fd.append("logo", files.logo);
          if (files.receipt) fd.append("venue_receipt", files.receipt);

          const up = await fetch(`${API_BASE}/events/${createdId}/`, {
            method: "PATCH",
            headers: getAuthHeadersMultipart(),
            body: fd,
          });
          if (!up.ok) throw new Error("File upload failed");
        }

        alert(event?.id ? "Event updated!" : "Event created!");
        onClose();
        fetchEvents();
      } catch (e) {
        setFormError(e.message);
      } finally {
        setFormLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">
              {event?.id ? "Edit Event" : "Create New Event"}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <p>{formError}</p>
              </div>
            )}

            {/* ---- FORM FIELDS (same as original) ---- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Name *</label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Summer Basketball Championship"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., Kathmandu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Venue *</label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g., City Sports Complex"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Boys and Girls">Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level *</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  placeholder="e.g., Under 18"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format *</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  value={formData.duration_type}
                  onChange={(e) => setFormData({ ...formData, duration_type: e.target.value })}
                >
                  <option value="Tournament">Tournament</option>
                  <option value="League">League</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registration Fee *</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  value={formData.payment}
                  onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
                  placeholder="'Free' or amount in NRs"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 resize-none"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event details..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Logo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-violet-500 bg-gray-50">
                  {previews.logo ? (
                    <div className="relative">
                      <img src={previews.logo} alt="logo" className="w-full h-24 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeFile("logo")}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block text-center">
                      <Paperclip className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Click to upload</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "logo")}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Venue Receipt (PDF)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-violet-500 bg-gray-50">
                  {previews.receipt ? (
                    <div className="relative">
                      <div className="bg-red-50 p-2 rounded flex items-center justify-between">
                        <div className="flex items-center min-w-0">
                          <FileText className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                          <p className="text-xs text-gray-700 truncate">{previews.receipt}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile("receipt")}
                          className="text-red-500 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block text-center">
                      <FileText className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Click to upload</p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, "receipt")}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleSubmit}
              disabled={formLoading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium py-2 rounded-lg transition flex items-center justify-center"
            >
              {formLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Event"
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ---------- TEAM FORM (unchanged) ---------- */
  const TeamForm = ({ team, eventId, onClose }) => {
    const [formData, setFormData] = useState({
      team_name: team?.team_name || "",
      coach_name: team?.coach_name || "",
      contact_number: team?.contact_number || "",
      email: team?.email || "",
      gender: team?.gender || "Boys",
    });
    const [formLoading, setFormLoading] = useState(false);

    const handleSubmit = async () => {
      setFormLoading(true);
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
        }
      } catch {
        alert("Error updating team.");
      } finally {
        setFormLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl w-full max-w-md">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Edit Team</h3>
            <button onClick={onClose}><X className="w-6 h-6" /></button>
          </div>

          <div className="p-6 space-y-4">
            {["team_name", "coach_name", "contact_number", "email"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  value={formData[field]}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Boys and Girls">Mixed</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleSubmit}
              disabled={formLoading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 rounded-lg transition"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ---------- TEAMS MODAL ---------- */
  const TeamsModal = ({ event, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{event.name} - Teams</h3>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6">
          {event.teams?.length ? (
            <div className="space-y-3">
              {event.teams.map((team) => (
                <div
                  key={team.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{team.team_name}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Coach: <span className="font-medium">{team.coach_name}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Gender: <span className="font-medium">{team.gender}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Players: <span className="font-medium">{team.players_count}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTeam(team)}
                        className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(event.id, team.id)}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No teams enrolled yet.</p>
          )}
        </div>
      </div>
    </div>
  );

  /* ---------- RENDER ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Header – NO CREATE BUTTON */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your tournaments and teams</p>
          </div>
        </div>

        {/* Loading / Empty */}
        {loading && events.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.length === 0 ? (
              <p className="col-span-full text-center py-12 text-gray-500">No events found.</p>
            ) : (
              events.map((event) => {
                const status = getEventStatus(event.date);
                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex-1">{event.name}</h3>
                        <div className="flex flex-col items-end gap-1">
                          {/* Approval badge */}
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              event.approval_status === "approved"
                                ? "bg-green-100 text-green-700"
                                : event.approval_status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {event.approval_status?.charAt(0).toUpperCase() +
                              event.approval_status?.slice(1) || "Pending"}
                          </span>

                          {/* Upcoming / Past badge */}
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              status === "Upcoming"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {status}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-6 text-sm text-gray-600">
                        <p className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-violet-600" />
                          {formatDate(event.date)}
                        </p>
                        <p className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-violet-600" />
                          {event.venue}, {event.city}
                        </p>
                        <p className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-violet-600" />
                          {event.gender} • {event.level}
                        </p>
                        <p className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-violet-600" />
                          {event.payment}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            fetchTeamsForEvent(event.id);
                            setShowTeamsModal(true);
                          }}
                          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-3 rounded-lg transition text-sm flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Teams
                        </button>

                        <button
                          onClick={() => handleEditEvent(event)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg transition text-sm flex items-center justify-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-3 rounded-lg transition text-sm flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      
      {/* Modals */}
      {showEventForm && (
        <EventForm event={editingEvent} onClose={() => setShowEventForm(false)} />
      )}
      {showTeamsModal && selectedEvent && (
        <TeamsModal event={selectedEvent} onClose={() => setShowTeamsModal(false)} />
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