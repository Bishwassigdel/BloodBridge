// src/components/MapPicker.jsx
// Shared map component for BloodConnect — used across all pages
// Uses React-Leaflet + OpenStreetMap (100% free, no API key needed)

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Fix Leaflet default icon paths broken by Vite bundler ──────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Blood group color palette ───────────────────────────────────────────────
const BLOOD_COLORS = {
  'O+':  '#dc2626', // red-600
  'O-':  '#b91c1c', // red-700
  'A+':  '#2563eb', // blue-600
  'A-':  '#1d4ed8', // blue-700
  'B+':  '#16a34a', // green-600
  'B-':  '#15803d', // green-700
  'AB+': '#7c3aed', // violet-600
  'AB-': '#6d28d9', // violet-700
};

// ── Create a color-coded blood group pin icon ───────────────────────────────
export function createBloodGroupIcon(bloodGroup, isEmergency = false) {
  const color = isEmergency ? '#dc2626' : (BLOOD_COLORS[bloodGroup] || '#dc2626');
  const pulse  = isEmergency ? 'animation: ping-red 1.2s ease-out infinite;' : '';
  return L.divIcon({
    className: '',
    iconSize:    [32, 40],
    iconAnchor:  [16, 40],
    popupAnchor: [0, -38],
    html: `
      <div style="position:relative;width:32px;height:40px;">
        <div style="
          width:28px;height:28px;
          background:${color};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 3px 10px rgba(0,0,0,0.35);
          ${pulse}
        "></div>
        <span style="
          position:absolute;top:5px;left:50%;
          transform:translateX(-50%);
          font-size:8px;font-weight:800;
          color:white;white-space:nowrap;
        ">${bloodGroup || '?'}</span>
        ${isEmergency ? `<div style="
          position:absolute;top:-4px;right:-4px;
          width:12px;height:12px;
          background:#ef4444;border-radius:50%;
          border:2px solid white;
          animation:ping-red 1s ease-out infinite;
        "></div>` : ''}
      </div>`,
  });
}

// ── Hospital / location pin icon ────────────────────────────────────────────
export function createHospitalIcon(color = '#dc2626') {
  return L.divIcon({
    className: '',
    iconSize:    [34, 42],
    iconAnchor:  [17, 42],
    popupAnchor: [0, -40],
    html: `
      <div style="position:relative;width:34px;height:42px;">
        <div style="
          width:30px;height:30px;
          background:${color};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 3px 12px rgba(0,0,0,0.35);
        "></div>
        <span style="
          position:absolute;top:5px;left:50%;
          transform:translateX(-50%);
          font-size:13px;line-height:1;
        ">🏥</span>
      </div>`,
  });
}

// ── "You are here" user location icon ──────────────────────────────────────
export function createUserIcon() {
  return L.divIcon({
    className: '',
    iconSize:    [22, 22],
    iconAnchor:  [11, 11],
    popupAnchor: [0, -14],
    html: `
      <div class="emergency-pulse-dot" style="
        width:18px;height:18px;
        background:#2563eb;
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 0 0 4px rgba(37,99,235,0.3);
      "></div>`,
  });
}

// ── PickLocationOnClick — inner component (needs map context) ───────────────
function PickLocationOnClick({ onPick }) {
  useMapEvents({
    click(e) {
      if (onPick) onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// ── FlyToLocation — smoothly pan map to new center ──────────────────────────
function FlyToLocation({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom ?? map.getZoom(), { animate: true, duration: 1 });
  }, [center, map, zoom]);
  return null;
}

// ── FitBoundsToMarkers — auto-fit map view to show all markers ───────────────
function FitBoundsToMarkers({ markers }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (markers?.length > 1 && !fitted.current) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: true });
      fitted.current = true;
    }
  }, [markers, map]);
  return null;
}

// ════════════════════════════════════════════════════════════════════════════
//  MapPicker — Main exported component
// ════════════════════════════════════════════════════════════════════════════
/**
 * Props:
 *  height        {string}   CSS height, default '380px'
 *  center        {[lat,lng]} default map center
 *  zoom          {number}   default zoom level
 *  markers       {array}    [{ id, lat, lng, bloodGroup, label, subLabel, phone, isEmergency, type }]
 *  userLocation  {{lat,lng}} blue "You are here" dot
 *  radiusKm      {number}   if set, draws a circle around userLocation
 *  pickedLocation {{lat,lng}} controlled picked location (for picker mode)
 *  onLocationPick {fn}      called with {lat,lng} on map click
 *  flyTo         {{lat,lng}} when set, map flies to this position
 *  flyZoom       {number}   zoom when flying
 *  fitMarkers    {bool}     auto-fit bounds to all markers
 *  readOnly      {bool}     disable click-to-pick
 */
export default function MapPicker({
  height        = '380px',
  center        = [27.7172, 85.3240], // Kathmandu default
  zoom          = 12,
  markers       = [],
  userLocation  = null,
  radiusKm      = null,
  pickedLocation = null,
  onLocationPick = null,
  flyTo          = null,
  flyZoom        = 14,
  fitMarkers     = false,
  readOnly       = false,
  showGoogleMaps = null, // pass {lat, lng} to show Google Maps button; auto-uses userLocation if readOnly
}) {
  // Determine the Google Maps button link
  const gmapCoords = showGoogleMaps || userLocation;
  const gmapHref = gmapCoords
    ? `https://www.google.com/maps?q=${gmapCoords.lat},${gmapCoords.lng}`
    : center
    ? `https://www.google.com/maps/@${center[0]},${center[1]},15z`
    : null;

  return (
    <div style={{ width: '100%', zIndex: 0 }}>
      <div style={{ height, width: '100%', borderRadius: onLocationPick ? '12px' : '12px 12px 0 0', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        attributionControl={true}
      >
        {/* Free OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Click-to-pick handler */}
        {!readOnly && onLocationPick && (
          <PickLocationOnClick onPick={onLocationPick} />
        )}

        {/* Fly to new center */}
        {flyTo && <FlyToLocation center={[flyTo.lat, flyTo.lng]} zoom={flyZoom} />}

        {/* Auto-fit bounds */}
        {fitMarkers && markers.length > 1 && <FitBoundsToMarkers markers={markers} />}

        {/* User location dot + radius circle */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createUserIcon()}
            >
              <Popup>
                <div style={{ padding: '10px 14px', minWidth: '130px' }}>
                  <p style={{ fontWeight: 700, color: '#2563eb', margin: 0 }}>📍 You are here</p>
                </div>
              </Popup>
            </Marker>
            {radiusKm && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: '#dc2626',
                  fillColor: '#dc2626',
                  fillOpacity: 0.06,
                  weight: 2,
                  dashArray: '6 4',
                }}
              />
            )}
          </>
        )}

        {/* Picked location marker */}
        {pickedLocation && (
          <Marker
            position={[pickedLocation.lat, pickedLocation.lng]}
            icon={createHospitalIcon('#059669')}
          >
            <Popup>
              <div style={{ padding: '10px 14px' }}>
                <p style={{ fontWeight: 700, color: '#059669', margin: 0 }}>📍 Selected Location</p>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0' }}>
                  {pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* All custom markers */}
        {markers.map((m) => {
          const icon = m.type === 'hospital'
            ? createHospitalIcon(m.isEmergency ? '#dc2626' : '#7c3aed')
            : m.type === 'request'
            ? createBloodGroupIcon(m.bloodGroup, m.urgency === 'emergency')
            : createBloodGroupIcon(m.bloodGroup, m.isEmergency);

          return (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={icon}>
              <Popup>
                <MarkerPopup marker={m} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      </div>

      {/* Google Maps button — shown on all readOnly maps */}
      {!onLocationPick && gmapHref && (
        <a
          href={gmapHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '10px 16px',
            background: '#1a73e8',
            color: 'white',
            fontWeight: 700,
            fontSize: '13px',
            borderRadius: '0 0 12px 12px',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(26,115,232,0.3)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1557b0'}
          onMouseLeave={e => e.currentTarget.style.background = '#1a73e8'}
        >
          🗺️ {userLocation ? 'View My Location on Google Maps' : 'Open in Google Maps'}
        </a>
      )}
    </div>
  );
}

// ── Popup card rendered inside each marker popup ────────────────────────────
function MarkerPopup({ marker: m }) {
  const isEmergency = m.isEmergency;
  const accentColor = isEmergency ? '#dc2626' : (BLOOD_COLORS[m.bloodGroup] || '#dc2626');

  return (
    <div style={{ minWidth: '190px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: accentColor,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {isEmergency && (
          <span style={{ fontSize: '14px' }}>🚨</span>
        )}
        <div>
          <p style={{ color: 'white', fontWeight: 700, fontSize: '13px', margin: 0 }}>
            {m.label || m.bloodGroup}
          </p>
          {m.subLabel && (
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', margin: '2px 0 0' }}>
              {m.subLabel}
            </p>
          )}
        </div>
        {m.bloodGroup && (
          <span style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.25)',
            color: 'white',
            fontWeight: 800,
            fontSize: '11px',
            padding: '2px 7px',
            borderRadius: '99px',
          }}>{m.bloodGroup}</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '10px 14px' }}>
        {m.location && (
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 4px', display: 'flex', gap: '4px' }}>
            <span>📍</span> {m.location}
          </p>
        )}
        {m.phone && (
          <p style={{ fontSize: '11px', color: '#374151', margin: '0 0 4px' }}>
            📞 <a href={`tel:${m.phone}`} style={{ color: '#2563eb', fontWeight: 600 }}>{m.phone}</a>
          </p>
        )}
        {m.units && (
          <p style={{ fontSize: '11px', color: '#374151', margin: '0 0 4px' }}>
            🩸 <strong>{m.units}</strong> unit{m.units > 1 ? 's' : ''} needed
          </p>
        )}
        {m.lastDonation && (
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 4px' }}>
            🗓️ Last donated: {m.lastDonation}
          </p>
        )}
        {/* Distance badge */}
        {m.distance != null && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: '99px', padding: '2px 10px',
            fontSize: '11px', color: '#15803d', fontWeight: 700,
            margin: '4px 0',
          }}>
            📏 {m.distance.toFixed(1)} km away
          </div>
        )}

        {/* Urgency badge for blood requests */}
        {m.urgency === 'emergency' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '99px', padding: '2px 10px',
            fontSize: '11px', color: '#dc2626', fontWeight: 700,
            margin: '4px 0 4px 4px',
          }}>
            🚨 Emergency
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
          {m.phone && (
            <a
              href={`tel:${m.phone}`}
              style={{
                flex: 1, textAlign: 'center',
                background: accentColor, color: 'white',
                borderRadius: '8px', padding: '5px 8px',
                fontSize: '11px', fontWeight: 700,
                textDecoration: 'none', minWidth: '60px',
              }}
            >
              📞 Call
            </a>
          )}
          {/* Google Maps — directions for hospitals, pin for donors/requests */}
          <a
            href={
              m.type === 'hospital'
                ? `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`
                : `https://www.google.com/maps?q=${m.lat},${m.lng}`
            }
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, textAlign: 'center',
              background: '#1a73e8', color: 'white',
              borderRadius: '8px', padding: '5px 8px',
              fontSize: '11px', fontWeight: 700,
              textDecoration: 'none', minWidth: '60px',
            }}
          >
            🗺️ {m.type === 'hospital' ? 'Directions' : 'Maps'}
          </a>
        </div>
      </div>
    </div>
  );
}
