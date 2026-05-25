// src/components/DonationCertificate.jsx
// Printable / downloadable donor achievement certificate
import { useRef } from 'react';

// ── Badge tiers ───────────────────────────────────────────────────────────
const BADGES = [
  { min: 0,  max: 0,  label: 'First-Timer',    emoji: '🩸', color: '#6b7280', bg: '#f3f4f6', desc: 'Make your first donation!' },
  { min: 1,  max: 2,  label: 'Life Spark',      emoji: '✨', color: '#92400e', bg: '#fef3c7', desc: 'You\'ve started saving lives' },
  { min: 3,  max: 4,  label: 'Bronze Hero',     emoji: '🥉', color: '#b45309', bg: '#fef3c7', desc: 'A true donation hero' },
  { min: 5,  max: 9,  label: 'Silver Saver',    emoji: '🥈', color: '#475569', bg: '#f1f5f9', desc: 'Every drop you give matters' },
  { min: 10, max: 19, label: 'Gold Guardian',   emoji: '🥇', color: '#b45309', bg: '#fffbeb', desc: 'A guardian of many lives' },
  { min: 20, max: 49, label: 'Platinum Lifeline',emoji: '💎', color: '#1d4ed8', bg: '#eff6ff', desc: 'You are someone\'s miracle' },
  { min: 50, max: Infinity, label: 'Legend',    emoji: '🏆', color: '#7c3aed', bg: '#f5f3ff', desc: 'A living legend of giving' },
];

export function getBadge(totalDonations) {
  for (let i = BADGES.length - 1; i >= 0; i--) {
    if (totalDonations >= BADGES[i].min) return BADGES[i];
  }
  return BADGES[0];
}

// ── Next badge progress ────────────────────────────────────────────────────
export function getNextBadge(totalDonations) {
  for (const b of BADGES) {
    if (totalDonations < b.min) return { badge: b, remaining: b.min - totalDonations };
  }
  return null;
}

// ── DonorBadge — small inline badge chip ──────────────────────────────────
export function DonorBadge({ totalDonations, size = 'sm' }) {
  const badge = getBadge(totalDonations);
  const next  = getNextBadge(totalDonations);

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1',
    md: 'text-sm px-3.5 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center font-bold rounded-full ${sizeClasses[size]}`}
        style={{ background: badge.bg, color: badge.color, border: `1.5px solid ${badge.color}33` }}
      >
        <span>{badge.emoji}</span>
        <span>{badge.label}</span>
        <span className="ml-1 opacity-60">({totalDonations})</span>
      </span>
      {next && (
        <div className="w-full mt-0.5">
          <div className="flex justify-between text-xs text-gray-400 mb-0.5">
            <span>{next.remaining} more to <strong>{next.badge.label}</strong></span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, (totalDonations / next.badge.min) * 100)}%`,
                background: badge.color,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DonationCertificate — full printable certificate modal
// ══════════════════════════════════════════════════════════════════════════
export default function DonationCertificate({ user, donations = [], onClose }) {
  const certRef = useRef(null);
  const totalDonations = donations.length;
  const badge = getBadge(totalDonations);
  const lastDonation = donations[0]?.donatedAt
    ? new Date(donations[0].donatedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;
  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
      <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl">
        {/* Action bar */}
        <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between rounded-t-3xl no-print">
          <span className="font-semibold text-sm">🏆 Your Donation Certificate</span>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition"
            >
              🖨️ Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl leading-none px-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Certificate ───────────────────────────────────────────────── */}
        <div
          ref={certRef}
          className="bg-white p-8"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          {/* Outer border */}
          <div style={{
            border: '6px double #dc2626',
            borderRadius: '16px',
            padding: '32px 40px',
            position: 'relative',
            background: 'linear-gradient(135deg, #fff9f9 0%, #ffffff 50%, #fff9f9 100%)',
          }}>
            {/* Corner decorations */}
            {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} text-red-200 text-2xl`}>❧</div>
            ))}

            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-1">
                <div style={{
                  width: 44, height: 44,
                  background: 'linear-gradient(135deg,#dc2626,#ef4444)',
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>🩸</div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#dc2626', margin: 0, fontFamily: 'sans-serif', letterSpacing: '-0.5px' }}>
                  BloodBridge
                </h1>
              </div>
              <p style={{ color: '#6b7280', fontSize: 11, margin: 0, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
                Saving Lives · One Drop at a Time
              </p>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #fca5a5)' }} />
              <span style={{ color: '#dc2626', fontSize: 18 }}>✦</span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #fca5a5)' }} />
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <p style={{ color: '#9ca3af', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', fontFamily: 'sans-serif', margin: '0 0 6px' }}>
                Certificate of Recognition
              </p>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1f2937', margin: '0 0 4px', fontFamily: 'sans-serif' }}>
                Blood Donation Achievement
              </h2>
              <p style={{ color: '#6b7280', fontSize: 13, fontFamily: 'sans-serif', margin: 0 }}>
                This certificate is proudly presented to
              </p>
            </div>

            {/* Donor name */}
            <div className="text-center mb-6">
              <div style={{
                display: 'inline-block',
                borderBottom: '2px solid #dc2626',
                paddingBottom: 6,
                marginBottom: 4,
              }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: '#111827', fontFamily: 'cursive, Georgia', letterSpacing: '-0.5px' }}>
                  {user?.username || 'Valued Donor'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                <span style={{
                  background: '#fef2f2', color: '#dc2626',
                  border: '1px solid #fca5a5', borderRadius: 999,
                  padding: '3px 14px', fontSize: 13, fontFamily: 'sans-serif', fontWeight: 700,
                }}>
                  Blood Group: {user?.bloodGroup || '—'}
                </span>
                <span style={{
                  background: badge.bg, color: badge.color,
                  border: `1px solid ${badge.color}44`, borderRadius: 999,
                  padding: '3px 14px', fontSize: 13, fontFamily: 'sans-serif', fontWeight: 700,
                }}>
                  {badge.emoji} {badge.label}
                </span>
              </div>
            </div>

            {/* Body text */}
            <p style={{ textAlign: 'center', fontSize: 14, color: '#4b5563', lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'sans-serif' }}>
              In recognition of <strong style={{ color: '#dc2626' }}>{totalDonations} blood donation{totalDonations !== 1 ? 's' : ''}</strong> made through BloodConnect,
              demonstrating exceptional compassion and commitment to saving lives.
              {lastDonation && (
                <span> Most recent donation on <strong>{lastDonation}</strong>.</span>
              )}
            </p>

            {/* Stats row */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 24,
              background: '#fef2f2', borderRadius: 12, padding: '14px 24px', marginBottom: 20,
              flexWrap: 'wrap',
            }}>
              {[
                { label: 'Total Donations', value: totalDonations, icon: '🩸' },
                { label: 'Lives Impacted', value: totalDonations * 3, icon: '❤️' },
                { label: 'Badge Level', value: badge.label, icon: badge.emoji },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 18 }}>{stat.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626', fontFamily: 'sans-serif' }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #fca5a5)' }} />
              <span style={{ color: '#dc2626', fontSize: 14 }}>✦</span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #fca5a5)' }} />
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ width: 120, borderTop: '1.5px solid #374151', marginBottom: 4 }} />
                <p style={{ fontSize: 11, color: '#6b7280', fontFamily: 'sans-serif', margin: 0 }}>BloodBridge Platform</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#dc2626', fontFamily: 'sans-serif', fontWeight: 700, margin: '0 0 2px' }}>
                  {badge.emoji} {badge.desc}
                </p>
                <p style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'sans-serif', margin: 0, letterSpacing: 1 }}>
                  Issued: {issueDate}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ width: 120, borderTop: '1.5px solid #374151', marginBottom: 4, marginLeft: 'auto' }} />
                <p style={{ fontSize: 11, color: '#6b7280', fontFamily: 'sans-serif', margin: 0 }}>Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="bg-gray-50 px-6 py-3 rounded-b-3xl text-center no-print">
          <p className="text-xs text-gray-400">💡 Click "Print / Save PDF" → Choose "Save as PDF" in print dialog to download</p>
        </div>
      </div>
    </div>
  );
}
