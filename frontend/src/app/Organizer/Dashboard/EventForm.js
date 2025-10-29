import { useState } from 'react';
import { Calendar, DollarSign, Trophy, Upload, X, FileText, Paperclip } from 'lucide-react';

export default function EventForm({ onEventSubmitted }) {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    venue: '',
    city: '',
    description: '',
    gender: 'Boys',
    level: '',
    duration_type: 'League',
    payment: '',
  });
  
  const [files, setFiles] = useState({
    logo: null,
    receipt: null,
  });
  
  const [previews, setPreviews] = useState({
    logo: null,
    receipt: null,
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (fileType === 'logo') {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'];
      if (!validImageTypes.includes(file.type)) {
        setError('Logo must be an image file (JPG, PNG, GIF, BMP, WEBP, or SVG)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB');
        return;
      }
    } else if (fileType === 'receipt') {
      if (file.type !== 'application/pdf') {
        setError('Receipt must be a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Receipt file size must be less than 10MB');
        return;
      }
    }

    setFiles(prev => ({ ...prev, [fileType]: file }));
    
    if (fileType === 'logo') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setPreviews(prev => ({ ...prev, receipt: file.name }));
    }
    
    setError('');
  };

  const removeFile = (fileType) => {
    setFiles(prev => ({ ...prev, [fileType]: null }));
    setPreviews(prev => ({ ...prev, [fileType]: null }));
  };

  const validatePayment = (value) => {
    return value.toLowerCase() === 'free' || !isNaN(Number(value));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Event name is required');
      return false;
    }
    if (!formData.date) {
      setError('Event date is required');
      return false;
    }
    if (!formData.venue.trim()) {
      setError('Venue is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!formData.level.trim()) {
      setError('Level is required');
      return false;
    }
    if (!formData.payment.trim()) {
      setError('Payment information is required');
      return false;
    }
    if (!validatePayment(formData.payment)) {
      setError("Payment must be a number or the word 'Free'");
      return false;
    }

    const eventDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      setError('Event date must be in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userDataString = localStorage.getItem('user_data');
      if (!userDataString) {
        throw new Error('User not authenticated. Please login again.');
      }

      const userData = JSON.parse(userDataString);
      const organizerId = userData?.id;

      if (!organizerId) {
        throw new Error('User ID not found. Please login again.');
      }

      // Step 1: Create event with basic data
      const eventPayload = {
        name: formData.name.trim(),
        date: formData.date,
        venue: formData.venue.trim(),
        city: formData.city.trim(),
        description: formData.description.trim(),
        gender: formData.gender,
        level: formData.level.trim(),
        duration_type: formData.duration_type,
        payment: formData.payment.toLowerCase() === 'free' ? 'Free' : formData.payment,
        organizer: organizerId,
      };

      const response = await fetch(`http://127.0.0.1:8000/api/events/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      });

      const eventData = await response.json();

      if (!response.ok) {
        let errorMessage = 'Failed to create event';
        if (eventData.detail) {
          errorMessage = eventData.detail;
        } else if (eventData.non_field_errors?.length > 0) {
          errorMessage = eventData.non_field_errors[0];
        } else {
          const firstErrorKey = Object.keys(eventData)[0];
          if (firstErrorKey) {
            const errorValue = eventData[firstErrorKey];
            errorMessage = Array.isArray(errorValue) ? `${firstErrorKey}: ${errorValue[0]}` : `${firstErrorKey}: ${errorValue}`;
          }
        }
        throw new Error(errorMessage);
      }

      const createdEventId = eventData.id;

      // Step 2: Upload files if provided
      if (files.logo || files.receipt) {
        const formDataWithFiles = new FormData();
        
        if (files.logo) {
          formDataWithFiles.append('logo', files.logo);
        }
        if (files.receipt) {
          formDataWithFiles.append('venue_receipt', files.receipt);
        }

        console.log('Uploading files to event:', createdEventId);
        
        const updateResponse = await fetch(`http://127.0.0.1:8000/api/events/${createdEventId}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: formDataWithFiles,
        });

        console.log('File upload response status:', updateResponse.status);
        const updateData = await updateResponse.json();
        console.log('File upload response:', updateData);

        if (!updateResponse.ok) {
          console.error('File upload error details:', updateData);
          throw new Error(`File upload failed: ${JSON.stringify(updateData)}`);
        }
      }

      setSuccess(true);
      setFormData({
        name: '',
        date: '',
        venue: '',
        city: '',
        description: '',
        gender: 'Boys',
        level: '',
        duration_type: 'League',
        payment: '',
      });
      setFiles({ logo: null, receipt: null });
      setPreviews({ logo: null, receipt: null });

      if (onEventSubmitted) {
        onEventSubmitted(eventData);
      }

      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      setError(error.message || 'Error submitting form.');
      console.error('Event creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-violet-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Tournament Event</h1>
          <p className="text-gray-600">Fill in the details and upload your event materials</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl mb-6 flex items-start">
            <div className="mr-3 mt-0.5 text-lg">✅</div>
            <div>
              <p className="font-semibold">Event created successfully!</p>
              <p className="text-sm mt-1">Your event is pending approval. Check your dashboard for updates.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
              <div className="mr-3 mt-0.5">⚠️</div>
              <p>{error}</p>
            </div>
          )}

          {/* Event Details Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-violet-600" />
              Event Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  placeholder="e.g., Summer Basketball Championship 2024"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                    placeholder="e.g., Kathmandu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue *
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  placeholder="e.g., City Sports Complex"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none"
                  placeholder="Brief description of the tournament..."
                />
              </div>
            </div>
          </div>

          {/* Configuration Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender Category *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                >
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Boys and Girls">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level *
                </label>
                <input
                  type="text"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  placeholder="e.g., Under 18"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format *
                </label>
                <select
                  name="duration_type"
                  value={formData.duration_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                >
                  <option value="League">League</option>
                  <option value="Tournament">Tournament</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Registration Fee *
                </label>
                <input
                  type="text"
                  name="payment"
                  value={formData.payment}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  placeholder="'Free' or amount in NRs"
                />
              </div>
            </div>
          </div>

          {/* File Uploads Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-violet-600" />
              Event Materials
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Logo (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-violet-500 transition cursor-pointer bg-gray-50 hover:bg-violet-50">
                  {previews.logo ? (
                    <div className="relative">
                      <img src={previews.logo} alt="Logo preview" className="w-full h-32 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeFile('logo')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-gray-600 mt-2 text-center truncate">{files.logo.name}</p>
                    </div>
                  ) : (
                    <label className="cursor-pointer block text-center">
                      <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700 mb-1">Click to upload</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP, SVG up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'logo')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Receipt PDF (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-violet-500 transition cursor-pointer bg-gray-50 hover:bg-violet-50">
                  {previews.receipt ? (
                    <div className="relative">
                      <div className="bg-red-50 p-3 rounded flex items-center justify-between border border-red-200">
                        <div className="flex items-center min-w-0">
                          <FileText className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                          <p className="text-sm text-gray-700 truncate">{previews.receipt}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile('receipt')}
                          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block text-center">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700 mb-1">Click to upload</p>
                      <p className="text-xs text-gray-500">PDF only, up to 10MB</p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, 'receipt')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Event...
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5 mr-2" />
                Create Tournament Event
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}