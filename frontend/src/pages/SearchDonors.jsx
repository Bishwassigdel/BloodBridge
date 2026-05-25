// src/pages/SearchDonors.jsx
import { useState, useMemo, useCallback, lazy, Suspense } from 'react'
import api from '../services/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
const MapPicker = lazy(() => import('../components/MapPicker'))
import { useGeolocation, calculateDistance } from '../hooks/useGeolocation'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const RADIUS_OPTIONS = [5, 10, 20, 50]

function SearchDonors({ user, onLogout }) {
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('')
  const [searchLocation, setSearchLocation]         = useState('')
  const [radiusKm, setRadiusKm]                     = useState(10)
  const [viewMode, setViewMode]                     = useState('list') // 'list' | 'map'

  // Raw donors from API
  const [donors, setDonors]       = useState([])
  const [loading, setLoading]     = useState(false)
  const [apiError, setApiError]   = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const { location: userLocation, loading: gpsLoading, error: gpsError, getLocation } = useGeolocation()

  // ── Fetch donors from backend ─────────────────────────────────────────────
  const fetchDonors = useCallback(async (bloodGroup, location) => {
    setLoading(true)
    setApiError('')
    try {
      const params = { available: 'true' }
      if (bloodGroup) params.bloodGroup = bloodGroup
      if (location)   params.location   = location

      const res = await api.get('/api/blood/search-donors', { params })
      setDonors(res.data.donors || [])
      setHasSearched(true)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to load donors. Please try again.')
      setDonors([])
      setHasSearched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Filter + enrich donors with distance when GPS is active ──────────────
  const filteredDonors = useMemo(() => {
    let results = [...donors]

    if (userLocation) {
      results = results
        .map(d => ({
          ...d,
          distance: d.coordinates?.lat && d.coordinates?.lng
            ? calculateDistance(userLocation.lat, userLocation.lng, d.coordinates.lat, d.coordinates.lng)
            : null,
        }))
        .filter(d => d.distance == null || d.distance <= radiusKm)
        .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))
    }

    return results
  }, [donors, userLocation, radiusKm])

  // ── Build map markers from donors that have coordinates ───────────────────
  const mapMarkers = useMemo(() =>
    filteredDonors
      .filter(d => d.coordinates?.lat && d.coordinates?.lng)
      .map(d => ({
        id:           d._id,
        lat:          d.coordinates.lat,
        lng:          d.coordinates.lng,
        bloodGroup:   d.bloodGroup,
        label:        d.username,
        subLabel:     d.location || d.address || '',
        phone:        d.phone,
        lastDonation: d.lastDonation
          ? new Date(d.lastDonation).toLocaleDateString()
          : null,
        distance: d.distance ?? null,
      })),
  [filteredDonors])

  // ── Donors without coordinates (list-only) ────────────────────────────────
  const donorsWithoutCoords = useMemo(() =>
    filteredDonors.filter(d => !d.coordinates?.lat || !d.coordinates?.lng),
  [filteredDonors])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault()
    fetchDonors(selectedBloodGroup, searchLocation)
  }

  const handleNearMe = async () => {
    try {
      await getLocation()
      // Fetch all donors (let radius filter handle it client-side)
      await fetchDonors(selectedBloodGroup, '')
      setViewMode('map')
    } catch { /* error shown via gpsError state */ }
  }

  const handleReset = () => {
    setSelectedBloodGroup('')
    setSearchLocation('')
    setHasSearched(false)
    setDonors([])
    setApiError('')
    setViewMode('list')
  }

  // ── Donors on map vs not on map counts ────────────────────────────────────
  const onMapCount   = mapMarkers.length
  const offMapCount  = donorsWithoutCoords.length

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} onLogout={onLogout} />

      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-red-600">Find Blood Donors</h1>
            <p className="text-gray-500 mt-1 text-sm">Search real registered donors — filter by blood group, location, or use GPS</p>
          </div>

          {/* ── Search Form ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">

                {/* Blood group */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">Blood Group</label>
                  <select
                    value={selectedBloodGroup}
                    onChange={e => setSelectedBloodGroup(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                  >
                    <option value="">All Blood Groups</option>
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                {/* Location text search */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">Location / Name</label>
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={e => setSearchLocation(e.target.value)}
                    placeholder="e.g. Kathmandu, Lalitpur"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                  />
                </div>

                {/* Radius — only shown when GPS is active */}
                {userLocation && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">
                      Radius: <span className="text-red-600 font-bold">{radiusKm} km</span>
                    </label>
                    <div className="flex gap-2">
                      {RADIUS_OPTIONS.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRadiusKm(r)}
                          className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                            radiusKm === r
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'border-gray-200 text-gray-600 hover:border-red-300'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-xl transition flex items-center gap-2"
                >
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : '🔍'
                  }
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleNearMe}
                  disabled={gpsLoading || loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-xl transition flex items-center gap-2"
                >
                  {gpsLoading
                    ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : '📍'
                  }
                  Near Me
                </button>
                {hasSearched && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-6 rounded-xl transition"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Status messages */}
              {gpsError && (
                <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl">{gpsError}</p>
              )}
              {apiError && (
                <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl">{apiError}</p>
              )}
              {userLocation && (
                <p className="text-green-600 text-sm flex items-center gap-1.5">
                  ✅ Showing donors within <strong className="text-red-600 mx-1">{radiusKm} km</strong> of your location
                  {onMapCount > 0 && (
                    <span className="text-gray-400 ml-1">· {onMapCount} plotted on map</span>
                  )}
                </p>
              )}
            </form>
          </div>

          {/* ── How-to hint (before first search) ────────────────────────── */}
          {!hasSearched && !loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">How to find donors</h3>
              <div className="space-y-2 text-blue-700 text-sm">
                <p>🩸 Select a blood group and click <strong>Search</strong> to see all matching donors</p>
                <p>📍 Tap <strong>Near Me</strong> to use GPS — donors are sorted by distance and shown on the map</p>
                <p>📏 Use the radius slider (5 / 10 / 20 / 50 km) to control the search area</p>
                <p>🗺️ Switch to <strong>Map view</strong> to see donors plotted — click any pin to call them</p>
                <p className="text-blue-500 text-xs pt-1">Note: only donors who have set their location in their profile appear on the map.</p>
              </div>
            </div>
          )}

          {/* ── Loading skeleton ──────────────────────────────────────────── */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center">
              <span className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin inline-block mb-3" />
              <p className="text-gray-500">Searching for donors...</p>
            </div>
          )}

          {/* ── Results ──────────────────────────────────────────────────── */}
          {hasSearched && !loading && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">

              {/* Header + view toggle */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {filteredDonors.length} donor{filteredDonors.length !== 1 ? 's' : ''} found
                  </h2>
                  {userLocation && onMapCount < filteredDonors.length && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {onMapCount} on map · {offMapCount} location not set
                    </p>
                  )}
                </div>
                {filteredDonors.length > 0 && (
                  <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    {['list', 'map'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                          viewMode === mode
                            ? 'bg-white text-red-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {mode === 'list' ? '☰ List' : '🗺️ Map'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── MAP VIEW ─────────────────────────────────────────────── */}
              {viewMode === 'map' && (
                <div className="p-4">
                  {onMapCount === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <p className="text-4xl mb-3">🗺️</p>
                      <p className="font-semibold text-gray-600">No donors have set their location yet</p>
                      <p className="text-sm mt-1">
                        {filteredDonors.length > 0
                          ? `${filteredDonors.length} donor(s) found — switch to List view to contact them.`
                          : 'Try broadening your search filters.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-xl overflow-hidden border border-gray-200 mb-3">
                        <Suspense fallback={
                          <div className="h-[480px] flex items-center justify-center bg-red-50">
                            <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                          </div>
                        }>
                          <MapPicker
                            height="480px"
                            center={
                              userLocation
                                ? [userLocation.lat, userLocation.lng]
                                : [mapMarkers[0].lat, mapMarkers[0].lng]
                            }
                            zoom={userLocation ? 12 : 11}
                            markers={mapMarkers}
                            userLocation={userLocation}
                            radiusKm={userLocation ? radiusKm : null}
                            fitMarkers={!userLocation && mapMarkers.length > 1}
                          />
                        </Suspense>
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 px-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> You
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> O± donors
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-blue-700 inline-block" /> A± donors
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> B± donors
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-violet-600 inline-block" /> AB± donors
                        </span>
                        <span className="ml-auto text-gray-400 italic">Click any pin to call the donor</span>
                      </div>

                      {/* Donors without coords — show below map in a compact strip */}
                      {offMapCount > 0 && (
                        <div className="mt-4 border border-gray-100 rounded-xl p-4 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-500 mb-3">
                            {offMapCount} more donor{offMapCount !== 1 ? 's' : ''} found nearby (location not on map):
                          </p>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {donorsWithoutCoords.map(d => (
                              <DonorCard key={d._id} donor={d} compact />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── LIST VIEW ────────────────────────────────────────────── */}
              {viewMode === 'list' && (
                <div className="p-6">
                  {filteredDonors.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredDonors.map(donor => (
                        <DonorCard key={donor._id} donor={donor} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-4xl mb-3">🩸</p>
                      <p className="text-gray-600 font-semibold">No available donors found</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Try a different blood group, broader location, or a larger radius.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ── Donor card ───────────────────────────────────────────────────────────────
function DonorCard({ donor, compact = false }) {
  const lastDonatedText = donor.lastDonation
    ? new Date(donor.lastDonation).toLocaleDateString()
    : 'No record'

  if (compact) {
    return (
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{donor.username}</p>
          <p className="text-xs text-gray-500 truncate">{donor.location || 'Location not set'}</p>
          {donor.distance != null && (
            <p className="text-xs text-green-600 font-semibold">📏 {donor.distance.toFixed(1)} km</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">
            {donor.bloodGroup}
          </span>
          {donor.phone && (
            <a
              href={`tel:${donor.phone}`}
              className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition"
            >
              📞
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-red-200 transition group">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-800 group-hover:text-red-600 transition truncate mr-2">
          {donor.username}
        </h3>
        <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0">
          {donor.bloodGroup}
        </span>
      </div>
      <div className="space-y-1.5 text-sm text-gray-600">
        {(donor.location || donor.address) && (
          <p>📍 {donor.location || donor.address}</p>
        )}
        {donor.phone && <p>📞 {donor.phone}</p>}
        <p>🗓️ Last donated: {lastDonatedText}</p>
        {donor.distance != null && (
          <p className="text-green-600 font-semibold">📏 {donor.distance.toFixed(1)} km away</p>
        )}
        <p className="text-green-600 font-medium">✓ Available to donate</p>
        {donor.coordinates?.lat && (
          <p className="text-blue-500 text-xs">📌 Location on map</p>
        )}
      </div>
      {donor.phone && (
        <a
          href={`tel:${donor.phone}`}
          className="mt-3 block text-center bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl transition text-sm font-semibold"
        >
          📞 Contact Donor
        </a>
      )}
    </div>
  )
}

export default SearchDonors
