'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Users, Calendar, Plus, Trophy, MapPin, Trash2, User, Award, CreditCard, ArrowLeft
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api';

export default function CoachEnrollPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params?.eventId;
  const fromOrganizer = searchParams?.get('from') === 'organizer';

  const [event, setEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ team_name: '', gender: 'Boys' });
  const [players, setPlayers] = useState(
    Array(8).fill().map(() => ({
      player_name: '', position: 'PG', dob: '', jersey_no: '', player_photo: null, id_proof: null,
    }))
  );
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [processingStep, setProcessingStep] = useState('');

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setFormError('Invalid event ID');
      return;
    }
    const token = localStorage.getItem('access_token') || '';
    const headers = { Authorization: `Bearer ${token}` };

    const fetchEvent = async () => {
      const r = await fetch(`${API_BASE}/events/${eventId}/`, { headers });
      if (r.ok) return r.json();
      if (r.status === 404) return null;
      const text = await r.text();
      try {
        const err = JSON.parse(text);
        throw new Error(err.detail || err.error || `HTTP ${r.status}`);
      } catch (e) {
        if (e instanceof SyntaxError) throw new Error(`HTTP ${r.status}`);
        throw e;
      }
    };

    const fetchUser = async () => {
      const r = await fetch(`${API_BASE}/user/`, { headers });
      return r.ok ? r.json() : null;
    };

    Promise.all([fetchEvent(), fetchUser()])
      .then(([ev, user]) => {
        setEvent(ev);
        setCurrentUser(user);
        if (!ev) {
          setFormError('Event not found. It may have been removed or registration may be closed.');
        }
      })
      .catch((err) => setFormError(err?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBD';
  const isFreeEvent = !event?.payment || String(event.payment).toLowerCase() === 'free' || parseFloat(event.payment) === 0;
  const eventAmount = isFreeEvent ? 0 : parseFloat(event?.payment || 0);

  const addPlayer = () => { if (players.length < 15) setPlayers([...players, { player_name: '', position: 'PG', dob: '', jersey_no: '', player_photo: null, id_proof: null }]); };
  const removePlayer = (i) => { if (players.length > 8) setPlayers(players.filter((_, idx) => idx !== i)); };
  const updatePlayer = (i, f, v) => setPlayers(players.map((p, idx) => (idx === i ? { ...p, [f]: v } : p)));
  const handleFileChange = (i, f, file) => setPlayers(players.map((p, idx) => (idx === i ? { ...p, [f]: file } : p)));

  const parseMaxAgeFromLevel = (l) => {
    if (!l || typeof l !== 'string') return null;
    const m = String(l).trim().toLowerCase().match(/under\s*[-\s]*(\d+)|u\s*[-\s]*(\d+)|(\d+)\s*u/i);
    const n = m ? parseInt(m[1] || m[2] || m[3], 10) : null;
    return n != null && n > 0 ? n - 1 : null;
  };
  const parseLocalDate = (s) => {
    if (!s) return null;
    const str = typeof s === 'string' ? s.slice(0, 10) : null;
    if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const getAgeAsOf = (dob, asOf) => {
    if (!dob) return null;
    const birth = parseLocalDate(dob);
    const a = asOf ? (parseLocalDate(asOf) || new Date(asOf)) : new Date();
    if (!birth || !a) return null;
    let age = a.getFullYear() - birth.getFullYear();
    if (a.getMonth() < birth.getMonth() || (a.getMonth() === birth.getMonth() && a.getDate() < birth.getDate())) age -= 1;
    return age;
  };
  const getAgeValidationError = (list, ev) => {
    const max = parseMaxAgeFromLevel(ev?.level);
    if (max == null) return null;
    const ed = ev?.date ? (parseLocalDate(ev.date) || new Date(ev.date)) : new Date();
    const over = list.filter((p) => { const a = getAgeAsOf(p.dob, ed); return a != null && a > max; });
    if (over.length === 0) return null;
    return `The following player(s) exceed the age limit: ${over.map((p) => `${p.player_name} (age ${getAgeAsOf(p.dob, ed)})`).join(', ')}`;
  };

  const handleClose = () => {
    if (fromOrganizer && eventId) router.push(`/Organizer/events/${eventId}`);
    else router.push('/Coach');
  };

  const handleSubmit = async () => {
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    setProcessingStep('Validating form...');

    try {
      const validPlayers = players.filter((p) => p.player_name?.trim() && p.dob);
      if (validPlayers.length < 8) {
        setFormError('⚠️ At least 8 players with name and date of birth are required');
        setFormLoading(false);
        setProcessingStep('');
        return;
      }
      if (!formData.team_name?.trim()) {
        setFormError('⚠️ Team name is required');
        setFormLoading(false);
        setProcessingStep('');
        return;
      }
      const ageErr = getAgeValidationError(validPlayers, event);
      if (ageErr) {
        setFormError(`⚠️ ${ageErr}`);
        setFormLoading(false);
        setProcessingStep('');
        if (typeof window !== 'undefined' && window.alert) window.alert(`Age limit exceeded!\n\n${ageErr}`);
        return;
      }

      const missingPhoto = validPlayers.filter((p) => !(p.player_photo instanceof File));
      const missingDoc = validPlayers.filter((p) => !(p.id_proof instanceof File));
      if (missingPhoto.length > 0 || missingDoc.length > 0) {
        const parts = [];
        if (missingPhoto.length > 0) parts.push(`Player photo required for ${missingPhoto.length} player(s)`);
        if (missingDoc.length > 0) parts.push(`ID document required for ${missingDoc.length} player(s)`);
        setFormError(`⚠️ ${parts.join('. ')}. Every player must have both photo and ID document uploaded.`);
        setFormLoading(false);
        setProcessingStep('');
        return;
      }

      const token = localStorage.getItem('access_token');
      const auth = { Authorization: `Bearer ${token || ''}` };

      if (isFreeEvent) {
        setProcessingStep('Enrolling team...');
        const fd = new FormData();
          fd.append('team_name', formData.team_name.trim());
          fd.append('gender', formData.gender);
          fd.append('coach_name', currentUser?.name || currentUser?.username || 'Unknown');
          fd.append('contact_number', currentUser?.phone || '');
          fd.append('email', currentUser?.email || '');
          fd.append('event', event.id);
          validPlayers.forEach((p, i) => {
            fd.append(`players[${i}][player_name]`, p.player_name.trim());
            fd.append(`players[${i}][position]`, p.position);
            fd.append(`players[${i}][dob]`, p.dob || '');
            if (p.jersey_no) fd.append(`players[${i}][jersey_no]`, p.jersey_no);
            fd.append(`players[${i}][player_photo]`, p.player_photo);
            fd.append(`players[${i}][id_proof]`, p.id_proof);
          });
        const response = await fetch(`${API_BASE}/enroll/teams/`, { method: 'POST', headers: auth, body: fd });
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        if (response.ok) {
          setFormSuccess('✅ Team enrolled successfully!');
          setTimeout(() => {
            if (fromOrganizer && eventId) router.push(`/Organizer/events/${eventId}`);
            else router.push('/Coach');
          }, 1500);
        } else {
          setFormError(data.detail || data.error || 'Enrollment failed');
        }
        setFormLoading(false);
        setProcessingStep('');
        return;
      }

      setProcessingStep('Initiating secure payment...');
      const payload = {
        team_name: formData.team_name.trim(),
        gender: formData.gender,
        coach_name: currentUser?.name || currentUser?.username || 'Unknown',
        contact_number: currentUser?.phone || '',
        email: currentUser?.email || '',
        event: event.id,
        players: validPlayers.map((p) => ({ player_name: p.player_name.trim(), position: p.position, dob: p.dob || null, jersey_no: p.jersey_no ? parseInt(p.jersey_no) : null })),
      };
      const res = await fetch(`${API_BASE}/enroll/payments/khalti/initiate/`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_data: payload, event_id: event.id }),
      });
      const resData = res.ok ? await res.json() : {};
      if (!res.ok) {
        setFormError(resData.error || resData.detail || 'Payment initiation failed');
        setFormLoading(false);
        setProcessingStep('');
        return;
      }
      if (resData.pidx && resData.payment_url) {
        localStorage.setItem('pending_payment', JSON.stringify({ pidx: resData.pidx, reference_id: resData.reference_id, event_id: event.id, team_name: formData.team_name, amount: resData.amount, from_organizer: fromOrganizer }));
        setFormSuccess('✅ Redirecting to Khalti...');
        setTimeout(() => { window.location.href = resData.payment_url; }, 1000);
      } else {
        setFormError('Invalid response from payment gateway');
      }
      setFormLoading(false);
      setProcessingStep('');
    } catch (err) {
      setFormError(`❌ ${err.message}`);
      setFormLoading(false);
      setProcessingStep('');
    }
  };

  if (loading || !event) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center py-20">
          {loading ? <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent" /> : <p className="text-xl text-red-600">{formError || 'Event not found'}</p>}
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <button onClick={handleClose} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium">
          <ArrowLeft className="w-5 h-5" /> {fromOrganizer ? 'Back to Event' : 'Back to Dashboard'}
        </button>

        <div className="bg-white rounded-xl shadow-lg border p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-fjalla-one">{event.name}</h1>
            <p className="text-gray-600 flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(event.date)}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.venue}</span>
            </p>
          </div>

          {!isFreeEvent ? (
            <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="bg-purple-600 p-3 rounded-full"><CreditCard className="w-8 h-8 text-white" /></div>
                <div>
                  <p className="text-xl font-bold text-purple-900">Payment Required</p>
                  <p className="text-2xl font-extrabold text-purple-700">Rs. {eventAmount}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl flex items-center gap-4">
              <div className="bg-green-600 p-3 rounded-full"><Trophy className="w-8 h-8 text-white" /></div>
              <p className="text-xl font-bold text-green-900">Free Entry Event</p>
            </div>
          )}

          {formError && <div className="toast-message-right error mb-4"><p className="font-medium text-sm">{formError}</p></div>}
          {formSuccess && <div className="toast-message-right success mb-4"><p className="font-medium text-sm">{formSuccess}</p></div>}
          {formLoading && processingStep && <div className="toast-message-right info flex items-center gap-3 mb-4"><div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" /><p className="font-medium text-sm">{processingStep}</p></div>}

          <div className="space-y-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-blue-900 mb-4 font-fjalla-one">Coach Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><p className="text-sm text-gray-600">Name</p><p className="font-semibold">{currentUser?.name || currentUser?.username || 'Not set'}</p></div>
                <div><p className="text-sm text-gray-600">Email</p><p className="font-semibold">{currentUser?.email || 'Not set'}</p></div>
                <div><p className="text-sm text-gray-600">Phone</p><p className="font-semibold">{currentUser?.phone || 'Not set'}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Team Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. Himalayan Hawks" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500" value={formData.team_name} onChange={(e) => setFormData({ ...formData, team_name: e.target.value })} disabled={formLoading} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender <span className="text-red-500">*</span></label>
                <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} disabled={formLoading}>
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Boys and Girls">Mixed</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold text-gray-800 font-fjalla-one">Players ({players.length}/15) — Min 8</h4>
                <button onClick={addPlayer} disabled={players.length >= 15 || formLoading} className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Add Player
                </button>
              </div>
              <div className="space-y-6">
                {players.map((p, i) => (
                  <div key={i} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="font-semibold">Player {i + 1}</h5>
                      {players.length > 8 && <button onClick={() => removePlayer(i)} disabled={formLoading} className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"><Trash2 className="w-4 h-4" /> Remove</button>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><label className="block text-sm text-gray-700 mb-1">Name *</label><input type="text" className="w-full px-3 py-2 border rounded-lg" value={p.player_name} onChange={(e) => updatePlayer(i, 'player_name', e.target.value)} disabled={formLoading} /></div>
                      <div><label className="block text-sm text-gray-700 mb-1">DOB *</label><input type="date" className="w-full px-3 py-2 border rounded-lg" value={p.dob} onChange={(e) => updatePlayer(i, 'dob', e.target.value)} disabled={formLoading} /></div>
                      <div><label className="block text-sm text-gray-700 mb-1">Jersey</label><input type="number" min="0" max="99" className="w-full px-3 py-2 border rounded-lg" value={p.jersey_no} onChange={(e) => updatePlayer(i, 'jersey_no', e.target.value)} disabled={formLoading} /></div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm text-gray-700 mb-1">Position *</label>
                      <select className="w-full px-3 py-2 border rounded-lg" value={p.position} onChange={(e) => updatePlayer(i, 'position', e.target.value)} disabled={formLoading}>
                        <option value="PG">PG</option><option value="SG">SG</option><option value="SF">SF</option><option value="PF">PF</option><option value="C">C</option>
                      </select>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm text-gray-700 mb-1">Photo <span className="text-red-500">*</span></label><input type="file" accept="image/jpeg,image/png" className="w-full text-sm" onChange={(e) => handleFileChange(i, 'player_photo', e.target.files?.[0] || null)} disabled={formLoading} required /></div>
                      <div><label className="block text-sm text-gray-700 mb-1">ID Proof <span className="text-red-500">*</span></label><input type="file" accept="application/pdf" className="w-full text-sm" onChange={(e) => handleFileChange(i, 'id_proof', e.target.files?.[0] || null)} disabled={formLoading} required /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-8 border-t-2">
              <button onClick={handleSubmit} disabled={formLoading} className={`flex-1 py-5 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg disabled:opacity-60 ${isFreeEvent ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
                {formLoading ? <><div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />Processing...</> : isFreeEvent ? <><Trophy className="w-6 h-6" />Enroll Team</> : <><CreditCard className="w-6 h-6" />Proceed to Payment (Rs. {eventAmount})</>}
              </button>
              <button onClick={handleClose} disabled={formLoading} className="flex-1 py-5 px-8 rounded-xl bg-gray-600 text-white font-bold hover:bg-gray-700 disabled:opacity-50">Cancel</button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
