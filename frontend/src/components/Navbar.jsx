// // components/Navbar.jsx
// import { useState } from 'react'
// import { Link } from 'react-router-dom'
// import { FaHeartbeat, FaUserCircle, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa'

// const Navbar = ({ user, onLogout }) => {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
//   const [activeSection, setActiveSection] = useState('')

//   // Track active section for underline highlight (optional but nice)
//   // Removed scrollY tracking since we don't change style on scroll anymore
//   const scrollToSection = (id) => {
//     const el = document.getElementById(id)
//     if (el) {
//       el.scrollIntoView({ behavior: 'smooth' })
//     }
//     setMobileMenuOpen(false)
//   }

//   // Optional: still highlight active nav link as user scrolls
//   // (keeps UX nice without affecting background)
//   // If you don't want this either, just remove the useEffect below
//   useState(() => {
//     const handleScroll = () => {
//       const sections = ['stats', 'how-it-works', 'testimonials', 'cta']
//       const scrollPos = window.scrollY + 100

//       for (const section of sections.reverse()) {
//         const el = document.getElementById(section)
//         if (el && el.offsetTop <= scrollPos) {
//           setActiveSection(section)
//           break
//         }
//       }
//       if (window.scrollY < 200) setActiveSection('')
//     }

//     window.addEventListener('scroll', handleScroll)
//     return () => window.removeEventListener('scroll', handleScroll)
//   }, [])

//   const navLinks = [
//     { id: 'stats', label: 'Impact' },
//     { id: 'how-it-works', label: 'How It Works' },
//     { id: 'testimonials', label: 'Testimonials' },
//   ]

//   return (
//     <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100">
//       <div className="container mx-auto px-4">
//         <div className="flex items-center justify-between h-16 md:h-20">
//           {/* Logo */}
//           <Link
//             to="/"
//             className="flex items-center gap-3 group"
//             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
//           >
//             <div className="relative">
//               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
//                 <FaHeartbeat className="text-white text-xl animate-pulse-soft" />
//               </div>
//               <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-blue-500 to-orange-400 blur-lg opacity-40 group-hover:opacity-70 transition-opacity" />
//             </div>
//             <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
//               BloodBridge
//             </span>
//           </Link>

//           {/* Desktop Navigation */}
//           <div className="hidden md:flex items-center gap-8">
//             {navLinks.map((link) => (
//               <button
//                 key={link.id}
//                 onClick={() => scrollToSection(link.id)}
//                 className={`relative text-sm font-medium transition-all duration-300 ${
//                   activeSection === link.id
//                     ? 'text-blue-700'
//                     : 'text-gray-700 hover:text-blue-700'
//                 }`}
//               >
//                 {link.label}
//                 {activeSection === link.id && (
//                   <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full" />
//                 )}
//               </button>
//             ))}

//             {/* Auth Buttons or User Menu */}
//             {user ? (
//               <div className="relative group">
//                 <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
//                   <FaUserCircle className="text-lg" />
//                   <span className="hidden lg:inline">{user.name || user.email}</span>
//                 </button>

//                 {/* Dropdown */}
//                 <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 origin-top-right">
//                   <div className="py-2">
//                     <Link
//                       to={user.role === 'donor' ? '/donor/dashboard' : '/profile'}
//                       className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Dashboard
//                     </Link>
//                     <button
//                       onClick={onLogout}
//                       className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2"
//                     >
//                       <FaSignOutAlt />
//                       Logout
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex items-center gap-4">
//                 <Link
//                   to="/login"
//                   className="font-medium text-gray-700 hover:text-blue-700 transition-colors"
//                 >
//                   Login
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
//                 >
//                   Register Free
//                 </Link>
//               </div>
//             )}
//           </div>

//           {/* Mobile Menu Button */}
//           <button
//             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//             className="md:hidden p-2 rounded-lg text-gray-800"
//           >
//             {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
//           </button>
//         </div>

//         {/* Mobile Menu */}
//         {mobileMenuOpen && (
//           <div className="md:hidden py-6 border-t border-gray-200 bg-white/95 backdrop-blur-md">
//             <div className="flex flex-col gap-4">
//               {navLinks.map((link) => (
//                 <button
//                   key={link.id}
//                   onClick={() => scrollToSection(link.id)}
//                   className={`text-left px-4 py-2 font-medium transition-colors ${
//                     activeSection === link.id ? 'text-blue-700' : 'text-gray-700'
//                   }`}
//                 >
//                   {link.label}
//                 </button>
//               ))}

//               <div className="px-4 pt-4 border-t border-gray-200">
//                 {user ? (
//                   <>
//                     <div className="flex items-center gap-3 mb-4">
//                       <FaUserCircle className="text-2xl text-blue-600" />
//                       <div>
//                         <p className="font-medium text-gray-900">{user.name || user.email}</p>
//                         <p className="text-xs text-gray-500 capitalize">{user.role}</p>
//                       </div>
//                     </div>
//                     <Link
//                       to={user.role === 'donor' ? '/donor/dashboard' : '/profile'}
//                       className="block w-full text-center py-2.5 rounded-xl bg-blue-600 text-white font-medium mb-2"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Go to Dashboard
//                     </Link>
//                     <button
//                       onClick={onLogout}
//                       className="w-full text-left py-2 text-red-600 font-medium flex items-center gap-2"
//                     >
//                       <FaSignOutAlt />
//                       Logout
//                     </button>
//                   </>
//                 ) : (
//                   <div className="flex flex-col gap-3">
//                     <Link
//                       to="/login"
//                       className="block text-center py-2.5 border border-blue-600 text-blue-700 rounded-xl font-medium"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Login
//                     </Link>
//                     <Link
//                       to="/register"
//                       className="block text-center py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Register Free
//                     </Link>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </nav>
//   )
// }

// export default Navbar

// components/Navbar.jsx
// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
// import { FaHeartbeat, FaUserCircle, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa'

// const Navbar = ({ user, onLogout }) => {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
//   const [activeSection, setActiveSection] = useState('')

//   // Smooth scroll to section
//   const scrollToSection = (id) => {
//     const el = document.getElementById(id)
//     if (el) {
//       el.scrollIntoView({ behavior: 'smooth', block: 'start' })
//     }
//     setMobileMenuOpen(false)
//   }

//   // Track active section on scroll for underline highlight
//   useEffect(() => {
//     const handleScroll = () => {
//       const sections = ['stats', 'how-it-works', 'testimonials', 'hospital-pricing', 'map-section', 'cta']
//       const scrollPos = window.scrollY + 120 // offset for fixed navbar

//       let current = ''
//       for (const section of sections) {
//         const el = document.getElementById(section)
//         if (el && el.offsetTop <= scrollPos) {
//           current = section
//         }
//       }

//       setActiveSection(current)
//     }

//     window.addEventListener('scroll', handleScroll)
//     handleScroll() // Initial check
//     return () => window.removeEventListener('scroll', handleScroll)
//   }, [])

//   const navLinks = [
//     { id: 'stats', label: 'Impact' },
//     { id: 'how-it-works', label: 'How It Works' },
//     { id: 'testimonials', label: 'Testimonials' },
//     { id: 'hospital-pricing', label: 'Hospital Plans' },
//     { id: 'map-section', label: 'Find Donors' },
//   ]

//   return (
//     <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100 animate-fade-down">
//       <div className="container mx-auto px-4">
//         <div className="flex items-center justify-between h-16 md:h-20">
//           {/* Logo - Kept exactly as you love it */}
//           <Link
//             to="/"
//             className="flex items-center gap-3 group"
//             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
//           >
//             <div className="relative">
//               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
//                 <FaHeartbeat className="text-white text-xl animate-pulse-soft" />
//               </div>
//               <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-blue-500 to-orange-400 blur-lg opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
//             </div>
//             <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
//               BloodBridge
//             </span>
//           </Link>

//           {/* Desktop Navigation */}
//           <div className="hidden md:flex items-center gap-8">
//             {navLinks.map((link, idx) => (
//               <button
//                 key={link.id}
//                 onClick={() => scrollToSection(link.id)}
//                 className="relative text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors duration-300"
//                 style={{ animationDelay: `${idx * 100 + 200}ms` }}
//               >
//                 {link.label}
//                 <span
//                   className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500 ${
//                     activeSection === link.id ? 'w-full' : 'w-0'
//                   }`}
//                 />
//               </button>
//             ))}

//             {/* Auth Section */}
//             {user ? (
//               <div className="relative group">
//                 <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
//                   <FaUserCircle className="text-lg" />
//                   <span className="hidden lg:inline">{user.name || user.email}</span>
//                 </button>

//                 {/* Dropdown Menu */}
//                 <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 origin-top-right transform scale-95 group-hover:scale-100">
//                   <div className="py-3">
//                     <Link
//                       to={user.role === 'donor' ? '/donor/dashboard' : '/profile'}
//                       className="block px-5 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Dashboard
//                     </Link>
//                     <button
//                       onClick={onLogout}
//                       className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-3"
//                     >
//                       <FaSignOutAlt />
//                       Logout
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex items-center gap-5">
//                 <Link
//                   to="/login"
//                   className="font-medium text-gray-700 hover:text-blue-700 transition-colors duration-300"
//                 >
//                   Login
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105"
//                 >
//                   Register Free
//                 </Link>
//               </div>
//             )}
//           </div>

//           {/* Mobile Menu Toggle */}
//           <button
//             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//             className="md:hidden p-3 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors duration-300"
//           >
//             {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
//           </button>
//         </div>

//         {/* Mobile Menu */}
//         <div
//           className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
//             mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
//           }`}
//         >
//           <div className="py-6 border-t border-gray-200 bg-white/95 backdrop-blur-md">
//             <div className="flex flex-col gap-4">
//               {navLinks.map((link) => (
//                 <button
//                   key={link.id}
//                   onClick={() => scrollToSection(link.id)}
//                   className={`text-left px-4 py-3 font-medium transition-colors duration-300 ${
//                     activeSection === link.id ? 'text-blue-700' : 'text-gray-700'
//                   }`}
//                 >
//                   {link.label}
//                 </button>
//               ))}

//               <div className="px-4 pt-6 border-t border-gray-200">
//                 {user ? (
//                   <>
//                     <div className="flex items-center gap-4 mb-5 pb-4 border-b border-gray-100">
//                       <FaUserCircle className="text-3xl text-blue-600" />
//                       <div>
//                         <p className="font-semibold text-gray-900">{user.name || user.email}</p>
//                         <p className="text-sm text-gray-500 capitalize">{user.role}</p>
//                       </div>
//                     </div>
//                     <Link
//                       to={user.role === 'donor' ? '/donor/dashboard' : '/profile'}
//                       className="block w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg mb-3 hover:scale-105 transition-transform"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Go to Dashboard
//                     </Link>
//                     <button
//                       onClick={onLogout}
//                       className="w-full text-left py-3 text-red-600 font-medium flex items-center gap-3 hover:bg-red-50 rounded-lg px-4 transition-colors"
//                     >
//                       <FaSignOutAlt />
//                       Logout
//                     </button>
//                   </>
//                 ) : (
//                   <div className="flex flex-col gap-4">
//                     <Link
//                       to="/login"
//                       className="block text-center py-3.5 border-2 border-blue-600 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Login
//                     </Link>
//                     <Link
//                       to="/register"
//                       className="block text-center py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-transform"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Register Free
//                     </Link>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </nav>
//   )
// }

// export default Navbar


// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
// import { FaHeartbeat, FaUserCircle, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa'

// const Navbar = ({ user, onLogout }) => {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
//   const [activeSection, setActiveSection] = useState('')

//   // Smooth scroll to section
//   const scrollToSection = (id) => {
//     const el = document.getElementById(id)
//     if (el) {
//       el.scrollIntoView({ behavior: 'smooth', block: 'start' })
//     }
//     setMobileMenuOpen(false)
//   }

//   // Track active section on scroll for underline highlight
//   useEffect(() => {
//     const handleScroll = () => {
//       const sections = [
//         'how-it-works',
//         'testimonials',
//         'past-events',
//         'hospital-pricing',
//         'map-section',
//         'cta',
//       ]
//       const scrollPos = window.scrollY + 120 // offset for fixed navbar

//       let current = ''
//       for (const section of sections) {
//         const el = document.getElementById(section)
//         if (el && el.offsetTop <= scrollPos + 100) {
//           current = section
//         }
//       }

//       setActiveSection(current)
//     }

//     window.addEventListener('scroll', handleScroll)
//     handleScroll() // Initial check
//     return () => window.removeEventListener('scroll', handleScroll)
//   }, [])

//   const navLinks = [
//     { id: 'how-it-works', label: 'How It Works' },
//     { id: 'testimonials', label: 'Testimonials' },
//     { id: 'past-events', label: 'Past Events' },
//     { id: 'hospital-pricing', label: 'Hospital Plans' },
//     { id: 'map-section', label: 'Find Donors' },
//   ]

//   return (
//     <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100 animate-fade-down">
//       <div className="container mx-auto px-4">
//         <div className="flex items-center justify-between h-16 md:h-20">
//           {/* Logo */}
//           <Link
//             to="/"
//             className="flex items-center gap-3 group"
//             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
//           >
//             <div className="relative">
//               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
//                 <FaHeartbeat className="text-white text-xl animate-pulse-soft" />
//               </div>
//               <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-blue-500 to-orange-400 blur-lg opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
//             </div>
//             <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
//               BloodBridge
//             </span>
//           </Link>

//           {/* Desktop Navigation */}
//           <div className="hidden md:flex items-center gap-8">
//             {navLinks.map((link, idx) => (
//               <button
//                 key={link.id}
//                 onClick={() => scrollToSection(link.id)}
//                 className="relative text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors duration-300"
//                 style={{ animationDelay: `${idx * 100 + 200}ms` }}
//               >
//                 {link.label}
//                 <span
//                   className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500 ${
//                     activeSection === link.id ? 'w-full' : 'w-0'
//                   }`}
//                 />
//               </button>
//             ))}

//             {/* Auth Section */}
//             {user ? (
//               <div className="relative group">
//                 <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
//                   <FaUserCircle className="text-lg" />
//                   <span className="hidden lg:inline">{user.name || user.email}</span>
//                 </button>

//                 {/* Dropdown Menu */}
//                 <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 origin-top-right transform scale-95 group-hover:scale-100">
//                   <div className="py-3">
//                     <Link
//                       to={user.role === 'donor' ? '/donor/dashboard' : '/profile'}
//                       className="block px-5 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Dashboard
//                     </Link>
//                     <button
//                       onClick={onLogout}
//                       className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-3"
//                     >
//                       <FaSignOutAlt />
//                       Logout
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex items-center gap-5">
//                 <Link
//                   to="/login"
//                   className="font-medium text-gray-700 hover:text-blue-700 transition-colors duration-300"
//                 >
//                   Login
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105"
//                 >
//                   Register Free
//                 </Link>
//               </div>
//             )}
//           </div>

//           {/* Mobile Menu Toggle */}
//           <button
//             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//             className="md:hidden p-3 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors duration-300"
//           >
//             {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
//           </button>
//         </div>

//         {/* Mobile Menu */}
//         <div
//           className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
//             mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
//           }`}
//         >
//           <div className="py-6 border-t border-gray-200 bg-white/95 backdrop-blur-md">
//             <div className="flex flex-col gap-4">
//               {navLinks.map((link) => (
//                 <button
//                   key={link.id}
//                   onClick={() => scrollToSection(link.id)}
//                   className={`text-left px-4 py-3 font-medium transition-colors duration-300 ${
//                     activeSection === link.id ? 'text-blue-700' : 'text-gray-700'
//                   }`}
//                 >
//                   {link.label}
//                 </button>
//               ))}

//               <div className="px-4 pt-6 border-t border-gray-200">
//                 {user ? (
//                   <>
//                     <div className="flex items-center gap-4 mb-5 pb-4 border-b border-gray-100">
//                       <FaUserCircle className="text-3xl text-blue-600" />
//                       <div>
//                         <p className="font-semibold text-gray-900">{user.name || user.email}</p>
//                         <p className="text-sm text-gray-500 capitalize">{user.role}</p>
//                       </div>
//                     </div>
//                     <Link
//                       to={user.role === 'donor' ? '/donor/dashboard' : '/profile'}
//                       className="block w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg mb-3 hover:scale-105 transition-transform"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Go to Dashboard
//                     </Link>
//                     <button
//                       onClick={onLogout}
//                       className="w-full text-left py-3 text-red-600 font-medium flex items-center gap-3 hover:bg-red-50 rounded-lg px-4 transition-colors"
//                     >
//                       <FaSignOutAlt />
//                       Logout
//                     </button>
//                   </>
//                 ) : (
//                   <div className="flex flex-col gap-4">
//                     <Link
//                       to="/login"
//                       className="block text-center py-3.5 border-2 border-blue-600 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Login
//                     </Link>
//                     <Link
//                       to="/register"
//                       className="block text-center py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-transform"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       Register Free
//                     </Link>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </nav>
//   )
// }

// export default Navbar

// src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHeartbeat, FaUserCircle, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';

const Navbar = ({ user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  // Smooth scroll to section
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  // Track active section on scroll for underline highlight
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'how-it-works',
        'testimonials',
        'past-events',
        'hospital-pricing',
        'map-section',
        'cta',
      ];
      const scrollPos = window.scrollY + 120;

      let current = '';
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el && el.offsetTop <= scrollPos + 100) {
          current = section;
        }
      }

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'past-events', label: 'Past Events' },
    { id: 'hospital-pricing', label: 'Hospital Plans' },
    { id: 'map-section', label: 'Find Donors' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100 animate-fade-down">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                <FaHeartbeat className="text-white text-xl animate-pulse-soft" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-blue-500 to-orange-400 blur-lg opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
              BloodBridge
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link, idx) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="relative text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors duration-300"
                style={{ animationDelay: `${idx * 100 + 200}ms` }}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500 ${
                    activeSection === link.id ? 'w-full' : 'w-0'
                  }`}
                />
              </button>
            ))}

            {/* Auth Section */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
                  <FaUserCircle className="text-lg" />
                  <span className="hidden lg:inline">{user.username || user.email}</span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 origin-top-right transform scale-95 group-hover:scale-100">
                  <div className="py-3">
                    <Link
                      to={user.role === 'donor' ? '/donor/dashboard' : user.role === 'receiver' ? '/receiver/dashboard' : '/hospital/dashboard'}
                      className="block px-5 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-3"
                    >
                      <FaSignOutAlt />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Link
                  to="/login"
                  className="font-medium text-gray-700 hover:text-blue-700 transition-colors duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105"
                >
                  Register Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-3 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors duration-300"
          >
            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-6 border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`text-left px-4 py-3 font-medium transition-colors duration-300 ${
                    activeSection === link.id ? 'text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {link.label}
                </button>
              ))}

              <div className="px-4 pt-6 border-t border-gray-200">
                {user ? (
                  <>
                    <div className="flex items-center gap-4 mb-5 pb-4 border-b border-gray-100">
                      <FaUserCircle className="text-3xl text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{user.username || user.email}</p>
                        <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                    <Link
                      to={user.role === 'donor' ? '/donor/dashboard' : user.role === 'receiver' ? '/receiver/dashboard' : '/hospital/dashboard'}
                      className="block w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg mb-3 hover:scale-105 transition-transform"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={onLogout}
                      className="w-full text-left py-3 text-red-600 font-medium flex items-center gap-3 hover:bg-red-50 rounded-lg px-4 transition-colors"
                    >
                      <FaSignOutAlt />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-4">
                    <Link
                      to="/login"
                      className="block text-center py-3.5 border-2 border-blue-600 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block text-center py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-transform"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register Free
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;