'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  CheckCircle, XCircle, Clock, ArrowLeft, FileText, Image as ImageIcon,
  Calendar, MapPin, Users, User, Mail, AlertCircle
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id;
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchEvent = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/events/${eventId}/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleApprove = async () => {
    if (!confirm('Approve this event? It will be made public.')) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/events/${eventId}/approve/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        alert('Event approved successfully!');
        fetchEvent(); // Refresh event data
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to approve event');
      }
    } catch (error) {
      console.error('Error approving event:', error);
      alert('Error approving event');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    if (!confirm('Reject this event? An email will be sent to the organizer.')) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/events/${eventId}/reject/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });
      if (res.ok) {
        alert('Event rejected and organizer notified via email!');
        setShowRejectModal(false);
        setRejectionReason('');
        fetchEvent(); // Refresh event data
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reject event');
      }
    } catch (error) {
      console.error('Error rejecting event:', error);
      alert('Error rejecting event');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-300', label: 'Approved' },
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Pending' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-300', label: 'Rejected' },
    };
    const config = statusMap[status] || statusMap.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border-2 font-semibold ${config.color}`}>
        <Icon className="w-5 h-5" />
        <span>{config.label}</span>
      </span>
    );
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading event details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-32">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">{error || 'Event not found'}</p>
            <button
              onClick={() => router.push('/Admin')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 pt-32 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back Button */}
          <button
            onClick={() => router.push('/Admin')}
            className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Admin Dashboard</span>
          </button>

          {/* Event Header Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 font-fjalla-one">{event.name}</h1>
                  {getStatusBadge(event.approval_status || 'pending')}
                </div>
                <p className="text-gray-600 text-lg">{event.description || 'No description provided'}</p>
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-start space-x-3">
                <Calendar className="w-6 h-6 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Event Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(event.date)}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-6 h-6 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Venue</p>
                  <p className="text-lg font-semibold text-gray-900">{event.venue}, {event.city}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="w-6 h-6 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Enrolled Teams</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {event.enrolled_teams_count || 0} / {event.max_teams || 'Unlimited'}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-lg font-bold text-purple-600 mt-1">Rs.</span>
                <div>
                  <p className="text-sm text-gray-500">Payment</p>
                  <p className="text-lg font-semibold text-gray-900">{event.payment || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <User className="w-6 h-6 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Organizer</p>
                  <p className="text-lg font-semibold text-gray-900">{event.organizer_name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mail className="w-6 h-6 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Organizer Email</p>
                  <p className="text-lg font-semibold text-gray-900">{event.organizer_email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-semibold text-gray-900">{event.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Level</p>
                <p className="font-semibold text-gray-900">{event.level || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration Type</p>
                <p className="font-semibold text-gray-900">{event.duration_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Available Slots</p>
                <p className="font-semibold text-gray-900">{event.available_slots ?? 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Files Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Event Logo */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2 font-fjalla-one">
                <ImageIcon className="w-6 h-6 text-purple-600" />
                <span>Event Logo</span>
              </h2>
              {event.logo_url ? (
                <div className="space-y-4">
                  <img
                    src={event.logo_url}
                    alt={event.name}
                    className="w-full h-64 object-contain border-2 border-gray-200 rounded-lg bg-gray-50"
                  />
                  <a
                    href={event.logo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    View Full Size
                  </a>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No logo uploaded</p>
                </div>
              )}
            </div>

            {/* Venue Receipt PDF */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2 font-fjalla-one">
                <FileText className="w-6 h-6 text-purple-600" />
                <span>Venue Receipt</span>
              </h2>
              {event.venue_receipt_url ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold">PDF Document</p>
                    <p className="text-sm text-gray-500 mt-2">Venue rental receipt</p>
                  </div>
                  <a
                    href={event.venue_receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    View PDF Document
                  </a>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No receipt uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Rejection Reason (if rejected) */}
          {event.approval_status === 'rejected' && event.rejection_reason && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Rejection Reason</span>
              </h3>
              <p className="text-red-800">{event.rejection_reason}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 font-fjalla-one">Actions</h2>
            <div className="flex flex-wrap gap-4">
              {event.approval_status !== 'approved' && (
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Approve Event</span>
                </button>
              )}
              {event.approval_status !== 'rejected' && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Reject Event</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4 font-fjalla-one">Reject Event</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this event. This reason will be sent to the organizer via email.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
              rows="5"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
