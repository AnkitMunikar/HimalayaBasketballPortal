'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, Trophy, Clock, Award, ArrowLeft, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react';

// Ensure base URL includes /api so requests hit /api/events/... (backend mounts at api/events/)
const _origin = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/?$/, '');
const API_BASE = `${_origin}/api`;

const EventDetail = ({ eventId }) => {
  const router = useRouter();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [standings, setStandings] = useState([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [editStandings, setEditStandings] = useState(false);
  const [editRows, setEditRows] = useState([]);
  const [savingStandings, setSavingStandings] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventDetail();
    }
  }, [eventId]);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/events/${eventId}/`, {
        method: 'GET',
        headers,
      });

      if (response.status === 401) {
        const retryResponse = await fetch(`${API_BASE}/events/${eventId}/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!retryResponse.ok) {
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }

        const data = await retryResponse.json();
        setEvent(data);
        return;
      }

      if (response.status === 404) {
        throw new Error('Event not found');
      }

      if (response.status === 410) {
        throw new Error('Event is no longer available');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEvent(data);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatDateRange = (start, end) => {
    if (!start) return 'Date TBD';
    if (!end || end === start) return formatDate(start);
    try {
      const s = new Date(start);
      const e = new Date(end);
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch {
      return formatDate(start);
    }
  };

  const getEventStatus = () => {
    if (!event?.date) return 'upcoming';
    const today = new Date().toISOString().slice(0, 10);
    const start = event.date;
    const end = event.end_date || event.date;
    if (start > today) return 'upcoming';
    if (end >= today) return 'ongoing';
    return 'concluded';
  };

  const fetchStandings = async () => {
    if (!eventId) return;
    setStandingsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/standings/`);
      if (res.ok) {
        const data = await res.json();
        setStandings(Array.isArray(data) ? data : []);
        setEditRows(Array.isArray(data) ? data.map((r) => ({ ...r })) : []);
      }
    } catch {
      setStandings([]);
    } finally {
      setStandingsLoading(false);
    }
  };

  useEffect(() => {
    if (event?.id) fetchStandings();
  }, [event?.id]);

  const formatTime = (dateString) => {
    if (!dateString) return 'Time TBD';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Invalid time';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-800 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-black text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4 font-fjalla-one">Event Not Found</h2>
          <p className="text-gray-400 mb-8">{error || 'The event you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => router.back()}
            className="bg-violet-800 text-white px-8 py-3 rounded-md hover:bg-violet-900 transition-colors font-bold"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section with Event Image */}
      <div className="relative bg-gradient-to-br from-fuchsia-600 via-fuchsia-500 to-red-600 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: event.logo_url || event.logo ? `url(${event.logo_url || event.logo})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-2 sm:px-4 py-6 sm:py-12 lg:py-16">
         

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            {/* Event Logo */}
            {(event.logo_url || event.logo) && (
              <div className="flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                <img 
                  src={event.logo_url || event.logo} 
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Event Info */}
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight font-fjalla-one">
                {event.name || 'Unnamed Event'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mb-4 text-lg">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {formatDateRange(event.date, event.end_date)}
                </span>
                <span className="text-white/60">|</span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {event.city || 'Location TBD'}
                </span>
              </div>
              {getEventStatus() === 'ongoing' && (
                <span className="inline-block bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-sm font-bold mb-4">
                  Tournament happening
                </span>
              )}
              {getEventStatus() === 'concluded' && (
                <span className="inline-block bg-gray-500/20 text-gray-300 px-3 py-1 rounded-full text-sm font-bold mb-4">
                  Concluded
                </span>
              )}
              {getEventStatus() === 'upcoming' && (
                <span className="inline-block bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-bold mb-4">
                  Upcoming
                </span>
              )}
              <p className="text-xl text-white/90 mb-6">
                Organized by <span className="font-bold">{event.organizer_name || 'Tournament Organizer'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user_data') || 'null') : null;
                if (user && user.role === 'coach') {
                  router.push('/Coach');
                } else {
                  alert('Please login as a Coach to enroll your team');
                  router.push('/Login');
                }
              }}
              className="bg-violet-800 text-white px-8 py-3 rounded-md hover:bg-violet-900 transition-colors font-bold text-lg"
            >
              Event Registration
            </button>
            <button className="bg-zinc-800 text-white px-8 py-3 rounded-md hover:bg-zinc-700 transition-colors font-bold border border-zinc-700">
              View Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-8">
            {/* The Breakdown Section */}
            <div className="bg-zinc-900 rounded-xl p-4 sm:p-8 border border-zinc-800">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-violet-400 font-fjalla-one">The Breakdown</h2>
              {event.description ? (
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap mb-6">{event.description}</p>
              ) : (
                <p className="text-gray-300 leading-relaxed mb-6">
                  Join us for an exciting basketball event featuring competitive gameplay, 
                  professional officiating, and the opportunity to showcase your team's skills 
                  against top competition from across the region.
                </p>
              )}
              
              <div className="space-y-3 text-gray-300">
                <div className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>Top-notch facilities and experienced event staff</span>
                </div>
                <div className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>Certified officials and professional game management</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>Awards and recognition for winning teams</span>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-4 sm:p-8 border border-zinc-800">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-violet-400 font-fjalla-one">The Breakdown</h2>
              
              <div className="space-y-3 text-gray-300">
                <div className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>All Team Registration Payment is required to be done online at the time of registration.</span>
                </div>
                <div className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>Certified officials and professional game management</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className='text-red-600'> <b>WE WANT QUALITY MATCH-UPS & COMPETITIVE GAMES! PLEASE REGISTER APPROPRIATELY! CONTACT US WITH QUESTIONS!</b></span>
                </div>
              </div>
            </div>

            {/* Event Information Grid */}
            <div className="bg-zinc-900 rounded-xl p-4 sm:p-8 border border-zinc-800">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-violet-400">Event Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-zinc-800/50 rounded-lg p-4 sm:p-6 border border-zinc-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-violet-400/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-violet-400" />
                    </div>
                    <h3 className="font-bold text-white">Date & Time</h3>
                  </div>
                  <p className="text-gray-300 font-semibold">{formatDateRange(event.date, event.end_date)}</p>
                  {event.end_date && (
                    <p className="text-gray-400 text-sm">Multi-day tournament</p>
                  )}
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4 sm:p-6 border border-zinc-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-violet-800/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-violet-400" />
                    </div>
                    <h3 className="font-bold text-white">Venue</h3>
                  </div>
                  <p className="text-gray-300 font-semibold">{event.venue || 'Venue TBD'}</p>
                  <p className="text-gray-400 text-sm">{event.city || 'City TBD'}</p>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4 sm:p-6 border border-zinc-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-violet-800/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-violet-400" />
                    </div>
                    <h3 className="font-bold text-white">Category</h3>
                  </div>
                  <p className="text-gray-300 font-semibold">{event.gender || 'Any'}</p>
                  <p className="text-gray-400 text-sm">{event.level || 'All Levels'}</p>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4 sm:p-6 border border-zinc-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-violet-800/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-violet-400" />
                    </div>
                    <h3 className="font-bold text-white">Event Type</h3>
                  </div>
                  <p className="text-gray-300 font-semibold">{event.duration_type || 'Tournament'}</p>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4 sm:p-6 border border-zinc-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-violet-800/10 rounded-lg flex items-center justify-center">
                      <span className="text-violet-400 font-bold">Rs.</span>
                    </div>
                    <h3 className="font-bold text-white">Entry Fee</h3>
                  </div>
                  <p className="text-gray-300 font-semibold">
                    {event.payment === 'Free' || !event.payment ? 'Free Entry' : event.payment}
                  </p>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4 sm:p-6 border border-zinc-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-violet-800/10 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-violet-400" />
                    </div>
                    <h3 className="font-bold text-white">Teams Enrolled</h3>
                  </div>
                  <p className="text-gray-300 font-semibold">{event.enrolled_teams_count || 0} Teams</p>
                  {event.max_teams && (
                    <p className="text-gray-400 text-sm">Max: {event.max_teams} teams</p>
                  )}
                </div>
              </div>
            </div>

            {/* Standings */}
            <div className="bg-zinc-900 rounded-xl p-4 sm:p-8 border border-zinc-800">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-violet-400 font-fjalla-one">Standings</h2>
              {standingsLoading && (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent" />
                </div>
              )}
              {!standingsLoading && standings.length === 0 && !editStandings && (
                <p className="text-gray-400 py-4">No teams enrolled yet.</p>
              )}
              {!standingsLoading && (standings.length > 0 || editStandings) && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-700 text-gray-400">
                          <th className="py-2 pr-2">#</th>
                          <th className="py-2 pr-2">Team</th>
                          <th className="py-2 pr-2 text-center">W</th>
                          <th className="py-2 pr-2 text-center">L</th>
                          <th className="py-2 pr-2 text-center">PF</th>
                          <th className="py-2 pr-2 text-center">PA</th>
                          <th className="py-2 text-center">PD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(editStandings ? editRows : standings).map((row, i) => (
                          <tr key={row.team_enrollment_id || row.id || i} className="border-b border-zinc-800 text-gray-300">
                            <td className="py-2 pr-2 font-medium">{editStandings ? i + 1 : (row.rank || i + 1)}</td>
                            <td className="py-2 pr-2">{row.team_name || '—'}</td>
                            {editStandings ? (
                              <>
                                <td className="py-1 pr-1">
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-12 bg-zinc-800 border border-zinc-600 rounded px-1 py-1 text-center text-white"
                                    value={row.wins ?? 0}
                                    onChange={(e) => {
                                      const next = [...editRows];
                                      next[i] = { ...next[i], wins: parseInt(e.target.value, 10) || 0 };
                                      setEditRows(next);
                                    }}
                                  />
                                </td>
                                <td className="py-1 pr-1">
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-12 bg-zinc-800 border border-zinc-600 rounded px-1 py-1 text-center text-white"
                                    value={row.losses ?? 0}
                                    onChange={(e) => {
                                      const next = [...editRows];
                                      next[i] = { ...next[i], losses: parseInt(e.target.value, 10) || 0 };
                                      setEditRows(next);
                                    }}
                                  />
                                </td>
                                <td className="py-1 pr-1">
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-14 bg-zinc-800 border border-zinc-600 rounded px-1 py-1 text-center text-white"
                                    value={row.points_for ?? 0}
                                    onChange={(e) => {
                                      const next = [...editRows];
                                      next[i] = { ...next[i], points_for: parseInt(e.target.value, 10) || 0 };
                                      setEditRows(next);
                                    }}
                                  />
                                </td>
                                <td className="py-1 pr-1">
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-14 bg-zinc-800 border border-zinc-600 rounded px-1 py-1 text-center text-white"
                                    value={row.points_against ?? 0}
                                    onChange={(e) => {
                                      const next = [...editRows];
                                      next[i] = { ...next[i], points_against: parseInt(e.target.value, 10) || 0 };
                                      setEditRows(next);
                                    }}
                                  />
                                </td>
                                <td className="py-2 text-center text-gray-400">
                                  {(row.points_for ?? 0) - (row.points_against ?? 0)}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-2 pr-2 text-center">{row.wins ?? 0}</td>
                                <td className="py-2 pr-2 text-center">{row.losses ?? 0}</td>
                                <td className="py-2 pr-2 text-center">{row.points_for ?? 0}</td>
                                <td className="py-2 pr-2 text-center">{row.points_against ?? 0}</td>
                                <td className="py-2 text-center">{row.points_diff ?? (row.points_for - row.points_against) ?? 0}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(() => {
                    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user_data') || 'null') : null;
                    const canEdit = user && (user.role === 'event_organizer' || user.role === 'admin' || user.is_superuser);
                    if (!canEdit) return null;
                    if (editStandings) {
                      return (
                        <div className="mt-4 flex gap-2">
                          <button
                            disabled={savingStandings}
                            onClick={async () => {
                              setSavingStandings(true);
                              try {
                                const token = localStorage.getItem('access_token');
                                const res = await fetch(`${API_BASE}/events/${eventId}/standings/`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: token ? `Bearer ${token}` : '',
                                  },
                                  body: JSON.stringify({
                                    standings: editRows.map((r) => ({
                                      team_enrollment_id: r.team_enrollment_id,
                                      wins: r.wins ?? 0,
                                      losses: r.losses ?? 0,
                                      points_for: r.points_for ?? 0,
                                      points_against: r.points_against ?? 0,
                                    })),
                                  }),
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setStandings(Array.isArray(data) ? data : []);
                                  setEditStandings(false);
                                } else {
                                  const err = await res.json();
                                  alert(err.error || 'Failed to save standings');
                                }
                              } catch (e) {
                                alert('Failed to save standings');
                              } finally {
                                setSavingStandings(false);
                              }
                            }}
                            className="bg-violet-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50"
                          >
                            {savingStandings ? 'Saving…' : 'Save standings'}
                          </button>
                          <button
                            onClick={() => {
                              setEditStandings(false);
                              setEditRows(standings.map((r) => ({ ...r })));
                            }}
                            className="bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-zinc-600"
                          >
                            Cancel
                          </button>
                        </div>
                      );
                    }
                    return (
                      <button
                        onClick={async () => {
                          if (standings.length === 0) {
                            try {
                              const token = localStorage.getItem('access_token');
                              const res = await fetch(`${API_BASE}/enroll/events/${eventId}/teams/`, {
                                headers: { Authorization: token ? `Bearer ${token}` : '' },
                              });
                              if (res.ok) {
                                const teams = await res.json();
                                const list = Array.isArray(teams) ? teams : teams.results || [];
                                setEditRows(
                                  list.map((t) => ({
                                    team_enrollment_id: t.id,
                                    team_name: t.team_name,
                                    wins: 0,
                                    losses: 0,
                                    points_for: 0,
                                    points_against: 0,
                                  }))
                                );
                              }
                            } catch {
                              alert('Could not load teams');
                              return;
                            }
                          } else {
                            setEditRows(standings.map((r) => ({ ...r })));
                          }
                          setEditStandings(true);
                        }}
                        className="mt-4 bg-violet-600/20 text-violet-300 px-4 py-2 rounded-lg font-medium hover:bg-violet-600/30"
                      >
                        Edit standings
                      </button>
                    );
                  })()}
                </>
              )}
            </div>
          </div>

          {/* Right Column - Registration Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 sm:top-6 space-y-4 sm:space-y-6">
              {/* Registration Card */}
              <div className="bg-purple-950 rounded-xl p-4 sm:p-6 lg:p-8 text-white">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 font-fjalla-one">Register Now</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/20">
                    <span className="font-medium">Registration Deadline</span>
                    <span className="font-bold">
                      {new Date(event.date).getTime() - 5 * 24 * 60 * 60 * 1000 > Date.now() 
                        ? formatDate(new Date(new Date(event.date).getTime() - 5 * 24 * 60 * 60 * 1000))
                        : 'Soon'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pb-4 border-b border-white/20">
                    <span className="font-medium">Cost</span>
                    <span className="font-bold text-2xl">
                      {event.payment === 'Free' || !event.payment ? 'FREE' : event.payment}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-white/20">
                    <span className="font-medium">Divisions</span>
                    <span className="font-bold">{event.gender || 'All'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Gameplay</span>
                    <span className="font-bold">4 Game Min</span>
                  </div>
                </div>

                {(event.can_enroll_status?.can_enroll !== false) ? (
                  <button
                    onClick={() => {
                      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user_data') || 'null') : null;
                      if (user && user.role === 'coach') {
                        router.push('/Coach');
                      } else {
                        alert('Please login as a Coach to enroll your team');
                        router.push('/Login');
                      }
                    }}
                    className="w-full bg-white text-violet-800 py-3 sm:py-4 rounded-lg hover:bg-gray-100 transition-colors font-bold text-sm sm:text-base lg:text-lg mb-3"
                  >
                    Enroll Your Team
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-600 text-gray-400 py-3 sm:py-4 rounded-lg cursor-not-allowed font-bold text-sm sm:text-base lg:text-lg mb-3"
                  >
                    Registration Closed
                  </button>
                )}

          <p className="text-sm sm:text-base lg:text-xl font-semibold text-red-600 text-center">
            All registrations must be received 3 days prior to event start
          </p>
              </div>

              {/* Status Badge */}
              <div className="bg-zinc-900 rounded-xl p-4 sm:p-6 border border-zinc-800">
                <h4 className="font-bold mb-3 sm:mb-4 text-white text-sm sm:text-base">Event Status</h4>
                <div className="flex items-center gap-2">
                  {event.approval_status === 'approved' && (
                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/20">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-bold">Approved</span>
                    </div>
                  )}
                  {event.approval_status === 'pending' && (
                    <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-2 rounded-lg border border-amber-500/20">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-bold">Pending</span>
                    </div>
                  )}
                  {event.approval_status === 'rejected' && (
                    <div className="flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-lg border border-red-500/20">
                      <XCircle className="w-5 h-5" />
                      <span className="font-bold">Rejected</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-zinc-900 rounded-xl p-4 sm:p-6 border border-zinc-800">
                <h4 className="font-bold mb-3 sm:mb-4 text-white text-sm sm:text-base">Quick Stats</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Teams Enrolled</span>
                    <span className="text-white font-bold text-lg">{event.enrolled_teams_count || 0}</span>
                  </div>
                  {event.max_teams && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Spots Remaining</span>
                      <span className="text-violet-800 font-bold text-lg">
                        {event.max_teams - (event.enrolled_teams_count || 0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;