import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { dummyDonors, bloodGroups } from '../data/dummyData'

/**
 * Search Donors Page Component
 * Allows users to search for donors by blood group
 */
function SearchDonors({ user, onLogout }) {
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [filteredDonors, setFilteredDonors] = useState([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    
    let results = [...dummyDonors]

    // Filter by blood group
    if (selectedBloodGroup) {
      results = results.filter(donor => donor.bloodGroup === selectedBloodGroup)
    }

    // Filter by location (case-insensitive partial match)
    if (searchLocation) {
      results = results.filter(donor =>
        donor.location.toLowerCase().includes(searchLocation.toLowerCase())
      )
    }

    // Only show available donors
    results = results.filter(donor => donor.available)

    setFilteredDonors(results)
    setHasSearched(true)
  }

  const handleReset = () => {
    setSelectedBloodGroup('')
    setSearchLocation('')
    setFilteredDonors([])
    setHasSearched(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} onLogout={onLogout} />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-red-600 mb-8">Search Donors</h1>

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bloodGroup" className="block text-gray-700 font-medium mb-2">
                    Blood Group
                  </label>
                  <select
                    id="bloodGroup"
                    value={selectedBloodGroup}
                    onChange={(e) => setSelectedBloodGroup(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">All Blood Groups</option>
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="location" className="block text-gray-700 font-medium mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="City, State"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Results Section */}
          {hasSearched && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">
                Search Results ({filteredDonors.length} {filteredDonors.length === 1 ? 'donor' : 'donors'} found)
              </h2>

              {filteredDonors.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDonors.map((donor) => (
                    <div
                      key={donor.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">{donor.name}</h3>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                          {donor.bloodGroup}
                        </span>
                      </div>
                      <div className="space-y-2 text-gray-600 text-sm">
                        <p>
                          <span className="font-medium">Email:</span> {donor.email}
                        </p>
                        <p>
                          <span className="font-medium">Phone:</span> {donor.phone}
                        </p>
                        <p>
                          <span className="font-medium">Location:</span> {donor.location}
                        </p>
                        <p>
                          <span className="font-medium">Last Donation:</span> {donor.lastDonation}
                        </p>
                        <p className="text-green-600 font-medium">
                          ✓ Available for donation
                        </p>
                      </div>
                      <button className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition text-sm">
                        Contact Donor
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No donors found matching your criteria.</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Try adjusting your search filters.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info Section */}
          {!hasSearched && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                How to Search for Donors
              </h3>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Select a blood group to find matching donors</li>
                <li>Optionally filter by location to find nearby donors</li>
                <li>Click "Search" to see available donors</li>
                <li>Contact donors directly through the provided information</li>
              </ul>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default SearchDonors

