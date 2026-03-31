// src/components/LifeSaverModal.jsx
import { useEffect, useState } from 'react'; // useState kept for show animation
import { FaHeart, FaTimes, FaPhone, FaHospital, FaTint, FaHandHoldingHeart, FaWhatsapp } from 'react-icons/fa';

/**
 * LifeSaverModal
 *
 * Props:
 *   open      : boolean
 *   request   : { hospital, bloodGroup, units, contactPhone, requester: { username } }
 *   onClose   : () => void
 */
export default function LifeSaverModal({ open, request, onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => setShow(true), 10);
    } else {
      setShow(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[9998] flex items-center justify-center p-4 transition-all duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transition-all duration-400 ${show ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}`}>

        {/* Red hero section */}
        <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 pt-8 pb-10 text-center relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => (
              <FaHeart key={i} className="absolute text-white text-6xl animate-pulse"
                style={{
                  top: `${[10, 60, 20, 70, 5, 50][i]}%`,
                  left: `${[5, 15, 55, 70, 85, 90][i]}%`,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: '2s',
                }}
              />
            ))}
          </div>

          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <FaTimes className="text-lg" />
          </button>

          {/* Animated heart icon */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 mx-auto">
            <FaHeart className="text-white text-4xl animate-bounce" style={{ animationDuration: '1s' }} />
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          </div>

          <h2 className="text-2xl font-extrabold text-white leading-tight">
            You may have just<br />saved a life! ❤️
          </h2>
          <p className="text-red-100 text-sm mt-2">
            Thank you for stepping up. Your act of kindness matters more than you know.
          </p>
        </div>

        {/* Request details */}
        {request && (
          <div className="px-6 py-5 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Request Details</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 bg-red-50 rounded-xl px-3 py-2.5">
                <FaTint className="text-red-500 text-sm flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Blood Group</p>
                  <p className="text-sm font-bold text-red-700">{request.bloodGroup}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                <FaHandHoldingHeart className="text-gray-500 text-sm flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Units</p>
                  <p className="text-sm font-bold text-gray-700">{request.units} unit{request.units !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {request.hospital && (
              <div className="flex items-center gap-2.5 bg-blue-50 rounded-xl px-3 py-2.5">
                <FaHospital className="text-blue-500 text-sm flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Hospital</p>
                  <p className="text-sm font-bold text-blue-700">{request.hospital}</p>
                </div>
              </div>
            )}

            {request.contactPhone && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium">Contact the patient now</p>
                <div className="flex gap-2">
                  {/* Call button */}
                  <a
                    href={`tel:${request.contactPhone}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-3 py-3 transition-colors font-semibold text-sm"
                  >
                    <FaPhone className="text-sm" />
                    Call
                  </a>

                  {/* WhatsApp button */}
                  <a
                    href={`https://wa.me/${request.contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hi! I accepted your blood request at ${request.hospital || 'the hospital'}. I'm ready to donate ${request.bloodGroup} blood (${request.units} unit${request.units !== 1 ? 's' : ''}). When can I come?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl px-3 py-3 transition-colors font-semibold text-sm"
                  >
                    <FaWhatsapp className="text-base" />
                    WhatsApp
                  </a>
                </div>
                <p className="text-xs text-gray-400 text-center">{request.contactPhone}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98] shadow-sm"
          >
            Got it! I'll reach out now 🙏
          </button>
        </div>
      </div>
    </div>
  );
}
