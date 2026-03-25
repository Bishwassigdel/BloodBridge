// src/components/DonorEligibility.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaTint,
  FaCalendarAlt,
  FaCheckCircle,
  FaLock,
  FaClock,
  FaHeart,
  FaToggleOn,
  FaToggleOff,
  FaSpinner,
  FaInfoCircle,
  FaAward,
  FaFireAlt,
  FaPlusCircle,
  FaHospital,
  FaTimes,
  FaHistory,
  FaMapMarkerAlt,
} from 'react-icons/fa';

const COOLDOWN_DAYS = 56;
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// ── Circular progress ring ─────────────────────────────────────────────────
function CircularProgress({ percent, eligible, daysLeft, totalDonations }) {
  const radius = 70;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(percent), 120);
    return () => clearTimeout(t);
  }, [percent]);

  const animatedOffset = circumference - (animated / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: radius * 2, height: radius * 2 }}>
      <svg width={radius * 2} height={radius * 2} className="rotate-[-90deg]">
        <circle cx={radius} cy={radius} r={normalizedRadius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle
          cx={radius} cy={radius} r={normalizedRadius} fill="none"
          stroke={eligible ? '#22c55e' : '#ef4444'}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          style={{ transition: 'stroke-dashoffset 1.2s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {eligible ? (
          <>
            <FaCheckCircle className="text-green-500 text-xl mb-0.5" />
            <span className="text-xs font-bold text-green-600">Eligible!</span>
            {totalDonations > 0 && (
              <span className="text-xs text-gray-400 mt-1">🩸 ×{totalDonations}</span>
            )}
          </>
        ) : (
          <>
            <span className="text-3xl font-extrabold text-red-600 leading-none">{daysLeft}</span>
            <span className="text-xs text-gray-500 font-medium mt-0.5">days left</span>
            {totalDonations > 0 && (
              <span className="text-xs text-gray-400 mt-1">🩸 ×{totalDonations}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Small stat badge ───────────────────────────────────────────────────────
function StatBadge({ icon: Icon, label, value, color = 'red' }) {
  const colors = {
    red: 'bg-red-50 text-red-700 border-red-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors[color]}`}>
      <Icon className="text-lg flex-shrink-0" />
      <div>
        <p className="text-xs font-medium opacity-70">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
// section="overview" → compact: count banner + eligibility ring + availability toggle (for dashboard embed)
// section="history"  → full:    header + record form + history list + tips (for History panel)
export default function DonorEligibility({ user, donations: initialDonations = [], onAvailabilityChange, onDonationRecorded, section = 'history' }) {
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);
  const [toggling, setToggling] = useState(false);
  const [toggleMsg, setToggleMsg] = useState('');
  const [now, setNow] = useState(Date.now());

  // Local donations — starts from prop, refreshes after each new record
  const [donations, setDonations] = useState(initialDonations);
  const [fetchingDonations, setFetchingDonations] = useState(false);

  // Record donation form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    hospital: '',
    bloodGroup: user?.bloodGroup || '',
    units: 1,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  // Tick every minute
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { setIsAvailable(user?.isAvailable ?? true); }, [user?.isAvailable]);

  // Sync if parent refreshes the donations prop
  useEffect(() => { setDonations(initialDonations); }, [initialDonations]);

  // ── Fetch donations from API ───────────────────────────────────────────
  const refreshDonations = async () => {
    setFetchingDonations(true);
    try {
      const res = await axios.get('/api/blood/my-donations');
      const fresh = res.data.donations || [];
      setDonations(fresh);
      if (onDonationRecorded) onDonationRecorded(fresh);
    } catch (e) {
      console.error('Failed to refresh donations:', e);
    } finally {
      setFetchingDonations(false);
    }
  };

  // ── Eligibility maths ──────────────────────────────────────────────────
  const sortedDonations = [...donations].sort(
    (a, b) => new Date(b.donatedAt || b.createdAt) - new Date(a.donatedAt || a.createdAt)
  );

  const lastDonationFromHistory =
    sortedDonations.length > 0
      ? new Date(sortedDonations[0].donatedAt || sortedDonations[0].createdAt)
      : null;

  const lastDonationDate =
    user?.lastDonation
      ? new Date(user.lastDonation)
      : lastDonationFromHistory;

  // Use the most recent between user.lastDonation and donation history
  const effectiveLastDonation =
    lastDonationDate && lastDonationFromHistory
      ? new Date(Math.max(lastDonationDate, lastDonationFromHistory))
      : lastDonationDate || lastDonationFromHistory;

  const nextEligibleDate = effectiveLastDonation
    ? new Date(effectiveLastDonation.getTime() + COOLDOWN_DAYS * 86_400_000)
    : null;

  const msLeft = nextEligibleDate ? nextEligibleDate - now : 0;
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86_400_000));
  const daysSince = effectiveLastDonation
    ? Math.floor((now - effectiveLastDonation) / 86_400_000)
    : null;
  const progressPercent = effectiveLastDonation
    ? Math.min(100, Math.round((daysSince / COOLDOWN_DAYS) * 100))
    : 100;
  const eligible = !effectiveLastDonation || daysLeft === 0;

  const totalDonations = donations.length;
  const totalUnits = donations.reduce((sum, d) => sum + (d.units || 1), 0);

  const formatDate = (d) =>
    d ? d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  // ── Availability toggle ────────────────────────────────────────────────
  const handleToggle = async () => {
    if (!eligible && !isAvailable) {
      setToggleMsg("Cooldown active — auto-unlocks on " + formatDate(nextEligibleDate));
      setTimeout(() => setToggleMsg(''), 3500);
      return;
    }
    setToggling(true);
    setToggleMsg('');
    try {
      const newVal = !isAvailable;
      await axios.patch('/api/auth/profile', { isAvailable: newVal });
      setIsAvailable(newVal);
      if (onAvailabilityChange) onAvailabilityChange(newVal);
      setToggleMsg(newVal ? 'You are now visible to receivers!' : 'You are now hidden from new requests.');
    } catch {
      setToggleMsg('Failed to update. Please try again.');
    } finally {
      setToggling(false);
      setTimeout(() => setToggleMsg(''), 3500);
    }
  };

  // ── Record donation submit ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hospital.trim()) {
      setFormMsg({ type: 'error', text: 'Hospital name is required.' });
      return;
    }
    setSubmitting(true);
    setFormMsg({ type: '', text: '' });
    try {
      await axios.post('/api/blood/donate', {
        hospital: form.hospital.trim(),
        bloodGroup: form.bloodGroup || user?.bloodGroup,
        units: Number(form.units),
        notes: form.notes.trim(),
      });
      setFormMsg({ type: 'success', text: `Donation recorded! Thank you for saving lives ❤️` });
      setForm({ hospital: '', bloodGroup: user?.bloodGroup || '', units: 1, notes: '' });
      setShowForm(false);
      // Refresh donations list so stats + dates update immediately
      await refreshDonations();
      // Auto-set unavailable
      setIsAvailable(false);
      if (onAvailabilityChange) onAvailabilityChange(false);
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.message || 'Failed to record donation.' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setFormMsg({ type: '', text: '' }), 4000);
    }
  };

  const tips = [
    { emoji: '💧', text: 'Drink 500ml of water before donating' },
    { emoji: '🥗', text: 'Eat a light iron-rich meal beforehand' },
    { emoji: '😴', text: 'Get a good night\'s sleep the night before' },
    { emoji: '🚫', text: 'Avoid alcohol 24 hours before donation' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Header + Record button — history section only ── */}
      {section === 'history' && (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <FaTint className="text-red-600 text-lg" />
                </span>
                Donation History
              </h3>
              <p className="text-sm text-gray-500 mt-1 ml-[52px]">Your past donation records</p>
            </div>
            {/* Record donation button */}
            <button
              onClick={() => { setShowForm(v => !v); setFormMsg({ type: '', text: '' }); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                showForm
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-md active:scale-95'
              }`}
            >
              {showForm ? <><FaTimes className="text-xs" /> Cancel</> : <><FaPlusCircle className="text-base" /> Record Donation</>}
            </button>
          </div>

          {/* ── Global feedback from form submission ── */}
          {formMsg.text && !showForm && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
              formMsg.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {formMsg.type === 'success' ? <FaCheckCircle /> : <FaInfoCircle />}
              {formMsg.text}
            </div>
          )}
        </>
      )}

      {/* ── Record Donation Form — history section only ── */}
      {section === 'history' && showForm && (
        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-md overflow-hidden">
          <div className="bg-red-600 px-5 py-3 flex items-center gap-2">
            <FaHospital className="text-white text-base" />
            <h4 className="text-white font-bold text-sm">Record a New Donation</h4>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">

            {/* Hospital */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Hospital / Blood Bank <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={form.hospital}
                  onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))}
                  placeholder="e.g. Civil Hospital, Kathmandu"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm"
                  required
                />
              </div>
            </div>

            {/* Blood group + units row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Blood Group</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {BLOOD_GROUPS.map(bg => (
                    <button
                      key={bg} type="button"
                      onClick={() => setForm(f => ({ ...f, bloodGroup: bg }))}
                      className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                        form.bloodGroup === bg
                          ? 'bg-red-600 border-red-600 text-white scale-105 shadow'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'
                      }`}
                    >{bg}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Units Donated</label>
                <div className="flex items-center gap-2">
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, units: Math.max(1, f.units - 1) }))}
                    className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 hover:border-red-400 hover:text-red-600 disabled:opacity-30 transition-all"
                    disabled={form.units <= 1}
                  >−</button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-extrabold text-red-600">{form.units}</span>
                    <p className="text-xs text-gray-400">~{form.units * 350}ml</p>
                  </div>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, units: Math.min(10, f.units + 1) }))}
                    className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 hover:border-red-400 hover:text-red-600 disabled:opacity-30 transition-all"
                    disabled={form.units >= 10}
                  >+</button>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any notes about this donation..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm resize-none"
              />
            </div>

            {formMsg.text && (
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border ${
                formMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {formMsg.type === 'success' ? <FaCheckCircle className="flex-shrink-0" /> : <FaInfoCircle className="flex-shrink-0" />}
                {formMsg.text}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className={`flex-[2] py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  submitting ? 'bg-red-400 cursor-not-allowed text-white' : 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md active:scale-[0.98]'
                }`}>
                {submitting ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaHeart /> Record Donation</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Donation count banner — overview section only ── */}
      {section === 'overview' && <div className={`rounded-2xl border px-5 py-4 flex items-center justify-between gap-4 ${
        totalDonations > 0 ? 'bg-red-600 border-red-600' : 'bg-gray-50 border-dashed border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            totalDonations > 0 ? 'bg-white/20' : 'bg-gray-100'
          }`}>
            <FaTint className={`text-2xl ${totalDonations > 0 ? 'text-white' : 'text-gray-300'}`} />
          </div>
          <div>
            <p className={`text-3xl font-extrabold ${totalDonations > 0 ? 'text-white' : 'text-gray-300'}`}>
              {totalDonations}
            </p>
            <p className={`text-sm font-medium ${totalDonations > 0 ? 'text-red-100' : 'text-gray-400'}`}>
              {totalDonations === 0
                ? 'No donations recorded yet'
                : totalDonations === 1
                ? 'donation recorded'
                : 'donations recorded'}
            </p>
          </div>
        </div>
        {totalDonations > 0 ? (
          <div className="text-right">
            <p className="text-white/70 text-xs font-medium">Lives potentially saved</p>
            <p className="text-2xl font-extrabold text-white">~{totalUnits * 3}</p>
            <p className="text-white/60 text-xs">{totalUnits} unit{totalUnits !== 1 ? 's' : ''} total</p>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:border-red-300 hover:text-red-600 transition-all"
          >
            Record first →
          </button>
        )}
        {fetchingDonations && (
          <FaSpinner className="animate-spin text-white/60 text-sm absolute top-3 right-3" />
        )}
      </div>}

      {/* ── Main eligibility card — overview section only ── */}
      {section === 'overview' && <div className={`bg-white rounded-2xl border-2 shadow-md overflow-hidden ${eligible ? 'border-green-200' : 'border-red-100'}`}>
        <div className={`h-1.5 w-full ${eligible ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`} />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <CircularProgress
              percent={progressPercent}
              eligible={eligible}
              daysLeft={daysLeft}
              totalDonations={totalDonations}
            />
            <div className="flex-1 space-y-4 w-full">
              {eligible ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-800 font-bold text-base flex items-center gap-2">
                    <FaHeart className="text-green-600" />
                    You're eligible to donate today!
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    {effectiveLastDonation
                      ? `It's been ${daysSince} days since your last donation. Your body is fully recovered.`
                      : 'No donation recorded yet — you\'re ready to donate for the first time!'}
                  </p>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-orange-800 font-bold text-base flex items-center gap-2">
                    <FaLock className="text-orange-500" />
                    Cooldown period active
                  </p>
                  <p className="text-orange-700 text-sm mt-1">
                    Your body needs <strong>{daysLeft} more day{daysLeft !== 1 ? 's' : ''}</strong> to fully replenish red blood cells.
                  </p>
                </div>
              )}

              {/* Date tiles */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-1">
                    <FaCalendarAlt className="text-xs" /> Last Donation
                  </p>
                  {effectiveLastDonation ? (
                    <>
                      <p className="text-sm font-bold text-gray-800">{formatDate(effectiveLastDonation)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{daysSince} day{daysSince !== 1 ? 's' : ''} ago</p>
                      {sortedDonations[0]?.hospital && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">📍 {sortedDonations[0].hospital}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-gray-400">Never donated</p>
                      <p className="text-xs text-gray-400 mt-0.5">No records yet</p>
                    </>
                  )}
                </div>
                <div className={`rounded-xl p-3 border ${eligible ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <p className={`text-xs font-medium flex items-center gap-1 mb-1 ${eligible ? 'text-green-600' : 'text-red-500'}`}>
                    <FaClock className="text-xs" /> Next Eligible
                  </p>
                  {effectiveLastDonation ? (
                    <>
                      <p className={`text-sm font-bold ${eligible ? 'text-green-700' : 'text-red-700'}`}>
                        {eligible ? 'Now!' : formatDate(nextEligibleDate)}
                      </p>
                      {eligible
                        ? <p className="text-xs text-green-500 mt-0.5">✅ Ready to donate</p>
                        : <p className="text-xs text-red-400 mt-0.5">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</p>
                      }
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-green-700">Now!</p>
                      <p className="text-xs text-green-500 mt-0.5">✅ No cooldown</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>}

      {/* ── Availability toggle — overview section only ── */}
      {section === 'overview' && <div className={`rounded-2xl border-2 shadow-sm p-5 ${
        !eligible ? 'bg-red-50 border-red-200' : isAvailable ? 'bg-white border-green-200' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!eligible ? 'bg-red-100' : isAvailable ? 'bg-green-100' : 'bg-gray-100'}`}>
            {!eligible ? <FaLock className="text-red-500 text-sm" /> : isAvailable ? <FaToggleOn className="text-green-600 text-base" /> : <FaToggleOff className="text-gray-400 text-base" />}
          </div>
          <p className="text-sm font-bold text-gray-800">Donor Availability</p>
          {!eligible && (
            <span className="ml-auto text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
              🔒 Auto-managed
            </span>
          )}
        </div>

        {!eligible ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white rounded-xl border border-red-200 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-red-700">Unavailable — Cooldown Active</p>
                <p className="text-xs text-red-500 mt-0.5">
                  Automatically set after donation. Resets on <strong>{formatDate(nextEligibleDate)}</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-red-100 rounded-lg px-3 py-1.5 cursor-not-allowed opacity-70">
                <FaLock className="text-red-500 text-xs" />
                <span className="text-xs font-semibold text-red-600">Locked</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Recovery progress</span>
                <span>{progressPercent}% · {daysLeft} days left</span>
              </div>
              <div className="w-full h-2.5 bg-red-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-400 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 text-center">
                ✅ Will auto-unlock on <strong className="text-gray-600">{formatDate(nextEligibleDate)}</strong>
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {isAvailable ? 'Receivers can find and contact you for donation' : 'You are hidden from new blood requests'}
              </p>
              <button onClick={handleToggle} disabled={toggling}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ml-4 flex-shrink-0 ${
                  toggling ? 'opacity-60 cursor-not-allowed bg-gray-100 text-gray-400'
                  : isAvailable ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm active:scale-95'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 active:scale-95'
                }`}>
                {toggling ? <FaSpinner className="animate-spin" /> : isAvailable ? <FaToggleOn className="text-xl" /> : <FaToggleOff className="text-xl" />}
                {toggling ? 'Saving...' : isAvailable ? 'Available' : 'Unavailable'}
              </button>
            </div>
            {toggleMsg && (
              <div className={`mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
                toggleMsg.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <FaInfoCircle className="flex-shrink-0" />{toggleMsg}
              </div>
            )}
          </div>
        )}
      </div>}

      {/* ── Donation History — history section only ── */}
      {section === 'history' && <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <FaHistory className="text-red-400" />
            Donation History
          </h4>
          <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
            {totalDonations} total
          </span>
        </div>

        {sortedDonations.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {sortedDonations.map((d, i) => {
              const date = new Date(d.donatedAt || d.createdAt);
              const dAgo = Math.floor((now - date) / 86_400_000);
              const isLatest = i === 0;
              return (
                <div key={d._id || i} className={`px-5 py-3.5 flex items-center gap-4 ${isLatest ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isLatest ? 'bg-red-600' : 'bg-gray-100'}`}>
                    <FaTint className={`text-sm ${isLatest ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">{d.hospital || 'Unknown Hospital'}</p>
                      {isLatest && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">Latest</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(date)} · {dAgo === 0 ? 'Today' : `${dAgo} days ago`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-red-600">{d.bloodGroup || user?.bloodGroup}</p>
                    <p className="text-xs text-gray-400">{d.units || 1} unit{(d.units || 1) !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 px-5">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaTint className="text-gray-300 text-xl" />
            </div>
            <p className="text-sm font-semibold text-gray-500">No donations yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Your donation history will appear here</p>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all">
              <FaPlusCircle /> Record your first donation
            </button>
          </div>
        )}
      </div>}

      {/* Tips / Why 56 days removed — history section shows only donation records */}
    </div>
  );
}
