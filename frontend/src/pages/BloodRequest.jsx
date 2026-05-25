// src/pages/BloodRequest.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect , lazy, Suspense } from 'react';
import api from '../services/api';
const MapPicker = lazy(() => import('../components/MapPicker'));
import { useGeolocation, reverseGeocode } from '../hooks/useGeolocation';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function BloodRequest() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const isEmergency = searchParams.get('mode') === 'emergency';

  const [formData, setFormData] = useState({
    bloodGroup: '',
    units: 1,
    hospital: '',
    contactPhone: '',
    note: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // multi-step feel: 1 = blood details, 2 = contact info

  // ── Map state ────────────────────────────────────────────────────────────
  const [showMap, setShowMap] = useState(false);
  const [pickedCoords, setPickedCoords] = useState(null); // { lat, lng }
  const [geocoding, setGeocoding] = useState(false);
  const { location: userLocation, loading: gpsLoading, error: gpsError, getLocation } = useGeolocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [navigate, location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleBloodGroupSelect = (bg) => {
    setFormData({ ...formData, bloodGroup: bg });
    setError('');
  };

  const handleUnits = (delta) => {
    const next = Math.min(10, Math.max(1, formData.units + delta));
    setFormData({ ...formData, units: next });
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.bloodGroup) {
      setError('Please select a blood group.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        hospital: formData.hospital,
        bloodGroup: formData.bloodGroup,
        units: Number(formData.units),
        urgency: isEmergency ? 'emergency' : 'normal',
        location: formData.hospital,
        contactPhone: formData.contactPhone,
        note: formData.note,
        // ── Map coordinates (saved to backend for future map features) ──
        coordinates: pickedCoords
          ? { lat: pickedCoords.lat, lng: pickedCoords.lng }
          : userLocation
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : { lat: null, lng: null },
      };

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login first');

      const res = await api.post('/api/blood/request', payload);

      if (res.data.success) {
        setSubmitted(true);
        if (isEmergency) {
          setTimeout(() => {
            window.open(
              `https://wa.me/9779801230045?text=Emergency%20blood%20request%3A%20${formData.bloodGroup}%20(${formData.units}%20units)%20needed%20at%20${formData.hospital}%2C%20Contact%3A%20${formData.contactPhone}%20Note%3A%20${formData.note}`,
              '_blank'
            );
          }, 1500);
        }
      } else {
        setError(res.data.message || 'Failed to submit request');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-white flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          {/* Animated checkmark */}
          <div className="relative inline-flex items-center justify-center w-28 h-28 mb-8">
            <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-40"></div>
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            {isEmergency ? 'Emergency Request Sent!' : 'Request Submitted!'}
          </h2>
          <p className="text-gray-500 text-base mb-8 leading-relaxed">
            {isEmergency
              ? 'We are notifying matching donors near you right now.'
              : 'We will match you with compatible donors and notify you shortly.'}
          </p>

          {/* What happens next */}
          <div className="bg-white rounded-2xl border border-red-100 shadow-lg p-6 mb-6 text-left space-y-4">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">What happens next</p>
            {[
              { icon: '🔍', text: 'Donors matching your blood group are notified instantly' },
              { icon: '📱', text: "You'll receive a call or message from a willing donor" },
              { icon: '🩸', text: isEmergency ? 'Emergency line: 9801230045 if no reply in 5 min' : 'You can track your request in your dashboard' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{item.icon}</span>
                <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Summary pill */}
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-5 py-2 text-sm font-medium text-red-700 mb-8">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            {formData.bloodGroup} · {formData.units} unit{formData.units > 1 ? 's' : ''} · {formData.hospital}
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Emergency Banner ───────────────────────────────────────────────────────
  const EmergencyBanner = () => (
    <div className="relative overflow-hidden bg-red-600 rounded-2xl p-5 mb-8 flex items-center gap-4 shadow-lg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent)]"></div>
      <div className="relative flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
        <span className="text-2xl animate-pulse">🚑</span>
      </div>
      <div className="relative">
        <p className="text-white font-bold text-lg leading-tight">Emergency Mode Active</p>
        <p className="text-red-100 text-sm mt-0.5">Your request will be prioritized immediately</p>
      </div>
    </div>
  );

  // ── Step indicator ────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 ${
            step >= s ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'
          }`}>
            {step > s ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : s}
          </div>
          <span className={`text-sm font-medium ${step >= s ? 'text-red-600' : 'text-gray-400'}`}>
            {s === 1 ? 'Blood Details' : 'Contact Info'}
          </span>
          {s < 2 && <div className={`w-8 h-0.5 mx-1 rounded ${step > s ? 'bg-red-400' : 'bg-gray-200'}`}></div>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-white py-12 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
            <span className="text-3xl">🩸</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {isEmergency ? 'Emergency Blood Request' : 'Request Blood'}
          </h1>
          <p className="text-gray-500 mt-2 text-base">
            {isEmergency ? 'Fill in the details below — help is on the way' : 'Find matching donors near you'}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-red-100 p-7 lg:p-9">
          {isEmergency && <EmergencyBanner />}
          <StepIndicator />

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: Blood Details ─────────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-7">
              {/* Blood Group visual picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Blood Group Needed <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => handleBloodGroupSelect(bg)}
                      className={`py-3.5 rounded-2xl text-base font-bold border-2 transition-all duration-200 ${
                        formData.bloodGroup === bg
                          ? 'bg-red-600 border-red-600 text-white shadow-lg scale-105'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 hover:scale-[1.03]'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
                {!formData.bloodGroup && (
                  <p className="mt-2 text-xs text-gray-400">Tap to select</p>
                )}
              </div>

              {/* Units stepper */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Units Needed <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => handleUnits(-1)}
                    disabled={formData.units <= 1}
                    className="w-12 h-12 rounded-2xl border-2 border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500 hover:border-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-4xl font-extrabold text-red-600">{formData.units}</span>
                    <p className="text-xs text-gray-400 mt-1">unit{formData.units > 1 ? 's' : ''} (350ml each)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnits(1)}
                    disabled={formData.units >= 10}
                    className="w-12 h-12 rounded-2xl border-2 border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500 hover:border-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Hospital + Map Picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hospital Name &amp; District <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="hospital"
                    placeholder="e.g. Teaching Hospital, Kathmandu"
                    value={formData.hospital}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none bg-white transition-all text-base"
                  />
                </div>

                {/* Map action buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const coords = await getLocation();
                        setPickedCoords(coords);
                        setShowMap(true);
                        setGeocoding(true);
                        const label = await reverseGeocode(coords.lat, coords.lng);
                        setGeocoding(false);
                        if (!formData.hospital) {
                          setFormData(prev => ({ ...prev, hospital: label }));
                        }
                      } catch { setGeocoding(false); }
                    }}
                    disabled={gpsLoading}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition disabled:opacity-60"
                  >
                    {gpsLoading
                      ? <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                      : '📍'
                    }
                    Detect My Location
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMap(m => !m)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl transition"
                  >
                    🗺️ {showMap ? 'Hide Map' : 'Pick on Map'}
                  </button>
                </div>

                {/* GPS error */}
                {gpsError && (
                  <p className="text-red-500 text-xs mt-1 bg-red-50 px-3 py-1.5 rounded-xl">{gpsError}</p>
                )}
                {geocoding && (
                  <p className="text-blue-500 text-xs mt-1">Looking up address...</p>
                )}

                {/* Inline Map */}
                {showMap && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
                      📍 Click on the map to pin the hospital / your exact location
                    </div>
                    <Suspense fallback={<div style={{height:"260px",display:"flex",alignItems:"center",justifyContent:"center",background:"#fef2f2"}}><div style={{width:28,height:28,border:"4px solid #fecaca",borderTopColor:"#dc2626",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/></div>}>
                    <MapPicker
                      height="280px"
                      center={
                        pickedCoords
                          ? [pickedCoords.lat, pickedCoords.lng]
                          : userLocation
                          ? [userLocation.lat, userLocation.lng]
                          : [27.7172, 85.3240]
                      }
                      zoom={14}
                      userLocation={userLocation}
                      pickedLocation={pickedCoords}
                      flyTo={pickedCoords || userLocation}
                      onLocationPick={async (coords) => {
                        setPickedCoords(coords);
                        setGeocoding(true);
                        const label = await reverseGeocode(coords.lat, coords.lng);
                        setGeocoding(false);
                        setFormData(prev => ({ ...prev, hospital: label }));
                      }}
                    />
                    </Suspense>
                    {pickedCoords && (
                      <div className="bg-green-50 px-4 py-2 text-xs text-green-700 border-t border-green-100">
                        ✅ Location pinned: {pickedCoords.lat.toFixed(5)}, {pickedCoords.lng.toFixed(5)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
              >
                Continue
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          )}

          {/* ── STEP 2: Contact Info ──────────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Summary bar */}
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-2">
                <span className="w-9 h-9 rounded-xl bg-red-600 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                  {formData.bloodGroup}
                </span>
                <div className="text-sm">
                  <p className="font-semibold text-gray-800">{formData.hospital}</p>
                  <p className="text-gray-500">{formData.units} unit{formData.units > 1 ? 's' : ''} needed</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto text-xs text-red-600 font-semibold hover:underline"
                >
                  Edit
                </button>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </span>
                  <input
                    type="tel"
                    name="contactPhone"
                    placeholder="98XXXXXXXX"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{10}"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none bg-white transition-all text-base"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Note{' '}
                  <span className="text-gray-400 font-normal">
                    ({isEmergency ? 'optional, max 100 chars' : 'optional'})
                  </span>
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  maxLength={isEmergency ? 100 : 500}
                  rows={isEmergency ? 2 : 3}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none bg-white transition-all text-base resize-none"
                  placeholder={
                    isEmergency
                      ? 'e.g. Thalassemia patient, urgent within 2 hours'
                      : 'Patient details, when needed, etc.'
                  }
                />
                {isEmergency && (
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {formData.note.length}/100
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-red-300 hover:text-red-600 transition-all text-base"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-[2] py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    loading
                      ? 'opacity-60 cursor-not-allowed bg-red-400'
                      : isEmergency
                      ? 'bg-red-700 hover:bg-red-800 hover:shadow-xl hover:scale-[1.02] active:scale-95'
                      : 'bg-gradient-to-r from-red-600 to-rose-600 hover:shadow-xl hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </>
                  ) : isEmergency ? (
                    '🚨 SEND EMERGENCY REQUEST'
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Your request is private and only shared with compatible donors nearby.
        </p>
      </div>
    </div>
  );
}

export default BloodRequest;
