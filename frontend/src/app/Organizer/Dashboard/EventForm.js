import { useState } from 'react';
import { Calendar, DollarSign, Trophy, Upload, X, FileText, Paperclip, MapPin, Users, Target } from 'lucide-react';

export default function EventForm({ onEventSubmitted }) {
  const nepalCities = [
    'Kathmandu',
    'Pokhara',
    'Lalitpur',
    'Bhaktapur',
    'Biratnagar',
    'Janakpur',
    'Hetauda',
    'Dhulikhel',
    'Gorkha',
    'Ilam',
    'Jhapa',
    'Nepalgunj',
    'Birganj',
    'Dharan',
    'Chitwan',
    'Dolakha',
    'Okhaldhunga',
    'Siraha',
    'Rupandehi',
    'Udaypur',
    'Sindhuli',
    'Ramechhap',
  ].sort();

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
    if (!files.logo) {
      setError('Event logo is required');
      return false;
    }
    if (!files.receipt) {
      setError('Venue receipt PDF is required');
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

  const isFileUploadComplete = files.logo && files.receipt;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Section - NBA Style */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-transparent"></div>
            <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
            <div className="h-1 w-12 bg-gradient-to-l from-blue-500 to-transparent"></div>
          </div>
          <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
            HIMALAYA BASKETBALL PORTAL
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mt-1">
              FORM REGISTRATION
            </span>
          </h1>
          <p className="text-slate-300 text-lg font-medium">Complete all fields to submit your event for approval</p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 border-l-4 border-green-300 text-white px-6 py-4 rounded-lg mb-8 flex items-start shadow-xl">
            <div className="mr-4 text-2xl">✅</div>
            <div>
              <p className="font-bold text-lg">Event Created Successfully!</p>
              <p className="text-green-100 text-sm mt-1">Your event is pending approval. Check your dashboard for updates.</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 border-l-4 border-red-300 text-white px-6 py-4 rounded-lg mb-8 flex items-start shadow-xl">
            <div className="mr-4 text-2xl">⚠️</div>
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200">
          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
            
            {/* Event Basic Information */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Event Information</h2>
              </div>

              <div className="space-y-6">
                {/* Event Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition font-semibold text-slate-900 placeholder-slate-400"
                    placeholder="e.g., National Basketball Championship 2024"
                  />
                </div>

                {/* Date and City Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Event Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      City <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-5 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition font-semibold text-slate-900"
                    >
                      <option value="">-- Select a City --</option>
                      {nepalCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Venue */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                    Venue <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition font-semibold text-slate-900 placeholder-slate-400"
                    placeholder="e.g., Nepal Sports Arena, Hall A"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                    Event Description <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-5 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition font-semibold text-slate-900 placeholder-slate-400 resize-none"
                    placeholder="Provide event details, rules, and additional information..."
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-slate-200"></div>

            {/* Configuration Section */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Event Configuration</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gender Category */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                    <Users className="w-4 h-4 inline mr-2" />
                    Gender Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition font-semibold text-slate-900"
                  >
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                    <option value="Boys and Girls">Mixed</option>
                  </select>
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                    Age Level <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition font-semibold text-slate-900 placeholder-slate-400"
                    placeholder="e.g., U-18, U-21, Open"
                  />
                </div>

                {/* Format */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                    Tournament Format <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="duration_type"
                    value={formData.duration_type}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition font-semibold text-slate-900"
                  >
                    <option value="League">League</option>
                    <option value="Tournament">Tournament</option>
                  </select>
                </div>

                {/* Payment */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Registration Fee <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="payment"
                    value={formData.payment}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition font-semibold text-slate-900 placeholder-slate-400"
                    placeholder="Type 'Free' or amount in NRs"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-slate-200"></div>

            {/* File Uploads Section */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Event Materials</h2>
                  <p className="text-sm text-slate-600 mt-1">Both files are required for submission</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">
                    Event Logo <span className="text-red-500">*</span>
                  </label>
                  <div className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer ${
                    previews.logo 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50'
                  }`}>
                    {previews.logo ? (
                      <div className="relative">
                        <img src={previews.logo} alt="Logo preview" className="w-full h-40 object-cover rounded-lg border-2 border-green-300" />
                        <button
                          type="button"
                          onClick={() => removeFile('logo')}
                          className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <div className="mt-3 text-center">
                          <p className="text-xs font-bold text-green-700 uppercase">✓ File Uploaded</p>
                          <p className="text-xs text-slate-600 mt-1 truncate">{files.logo.name}</p>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer block text-center">
                        <Paperclip className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-900 mb-1">Click to Upload Logo</p>
                        <p className="text-xs text-slate-600">PNG, JPG, GIF, WEBP, SVG (Max 5MB)</p>
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
                  <label className="block text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">
                    Venue Receipt PDF <span className="text-red-500">*</span>
                  </label>
                  <div className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer ${
                    previews.receipt 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50'
                  }`}>
                    {previews.receipt ? (
                      <div className="relative">
                        <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-4 rounded-lg border-2 border-green-300 flex items-center justify-between">
                          <div className="flex items-center min-w-0 gap-3">
                            <FileText className="w-6 h-6 text-green-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-green-700 uppercase">PDF Received</p>
                              <p className="text-sm text-slate-700 truncate font-semibold">{previews.receipt}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile('receipt')}
                            className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 p-1 hover:bg-red-100 rounded transition"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer block text-center">
                        <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-900 mb-1">Click to Upload Receipt</p>
                        <p className="text-xs text-slate-600">PDF Only (Max 10MB)</p>
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

              {/* Upload Status Indicator */}
              <div className={`mt-6 p-4 rounded-lg border-2 flex items-center gap-3 ${
                isFileUploadComplete
                  ? 'border-green-300 bg-green-50'
                  : 'border-yellow-300 bg-yellow-50'
              }`}>
                <div className={`w-3 h-3 rounded-full ${isFileUploadComplete ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className={`text-sm font-semibold ${isFileUploadComplete ? 'text-green-700' : 'text-yellow-700'}`}>
                  {isFileUploadComplete ? '✓ All files uploaded' : '⚠ Please upload all required files'}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-slate-200"></div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFileUploadComplete}
              className={`w-full font-black py-4 px-6 rounded-xl shadow-xl transition-all duration-200 flex items-center justify-center text-lg uppercase tracking-wider ${
                loading || !isFileUploadComplete
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white hover:shadow-2xl transform hover:scale-105'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent mr-3"></div>
                  Creating Event...
                </>
              ) : (
                <>
                  <Trophy className="w-6 h-6 mr-3" />
                  Submit Tournament Event
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          <p>All fields marked with <span className="text-red-500 font-bold">*</span> are required for submission</p>
        </div>
      </div>
    </div>
  );
}