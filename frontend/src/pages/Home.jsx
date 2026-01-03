//code 2
// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
// import { FaHeartbeat, FaSearch, FaHospitalAlt, FaShieldAlt, FaUsers, FaArrowRight, FaHandHoldingHeart, FaClock, FaAmbulance } from 'react-icons/fa'
// import Navbar from '../components/Navbar'
// import Footer from '../components/Footer'
// import { useScrollAnimation } from '../hooks/useScrollAnimation'
// import { useCounter } from '../hooks/useCounter'

// function Home({ user, onLogout }) {
//   const [scrollY, setScrollY] = useState(0)

//   // Scroll animation refs
//   const [statsRef, statsVisible] = useScrollAnimation({ threshold: 0.2 })
//   const [howItWorksRef, howItWorksVisible] = useScrollAnimation({ threshold: 0.1 })
//   const [testimonialsRef, testimonialsVisible] = useScrollAnimation({ threshold: 0.1 })
//   const [ctaRef, ctaVisible] = useScrollAnimation({ threshold: 0.2 })

//   // Animated counters
//   const livesCount = useCounter(5200, 2000, statsVisible)
//   const donorsCount = useCounter(1200, 2000, statsVisible)
//   const hospitalsCount = useCounter(75, 1500, statsVisible)
//   const responseTime = useCounter(15, 1500, statsVisible)

//   useEffect(() => {
//     const handleScroll = () => setScrollY(window.scrollY)
//     window.addEventListener('scroll', handleScroll)
//     return () => window.removeEventListener('scroll', handleScroll)
//   }, [])

//   const scrollToSection = (id) => {
//     const el = document.getElementById(id)
//     if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
//   }

//   return (
//     <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-100 via-white to-white overflow-x-hidden">
//       <Navbar user={user} onLogout={onLogout} />

//       <main className="flex-grow">
//         {/* Hero Section */}
//         <section className="relative overflow-hidden min-h-[90vh] flex items-center">
//           <div className="absolute inset-0 pointer-events-none overflow-hidden">
//             <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-60 animate-float-slow" style={{ transform: `translateY(${scrollY * 0.3}px)` }} />
//             <div className="absolute bottom-0 -left-20 w-72 h-72 bg-orange-100 rounded-full blur-3xl opacity-40 animate-float" style={{ transform: `translateY(${scrollY * 0.2}px)` }} />
//             <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-100 rounded-full blur-3xl opacity-30 animate-float-slow" style={{ transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.15}px)` }} />
//             {[...Array(6)].map((_, i) => (
//               <div key={i} className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-40 animate-float" style={{ left: `${20 + i * 15}%`, top: `${30 + i * 10}%`, animationDelay: `${i * 0.5}s`, animationDuration: `${4 + i}s` }} />
//             ))}
//           </div>

//           <div className="relative container mx-auto px-4 py-16 md:py-24 lg:py-28 z-10">
//             <div className="grid lg:grid-cols-2 gap-12 items-center">
//               {/* Left Text */}
//               <div className="animate-fade-up">
//                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-5 animate-scale-in">
//                   <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-soft" />
//                   Trusted community blood donation platform
//                 </div>

//                 <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
//                   <span className="inline-block animate-fade-up" style={{ animationDelay: '0.1s' }}>Donate Blood,</span>
//                   <br />
//                   <span className="text-blue-700 inline-block animate-fade-up" style={{ animationDelay: '0.2s' }}>Save Lives,</span>
//                   <br />
//                   <span className="text-gray-800 inline-block animate-fade-up" style={{ animationDelay: '0.3s' }}>Build a Lifeline Network.</span>
//                 </h1>

//                 <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-xl animate-fade-up" style={{ animationDelay: '0.4s' }}>
//                   BloodBridge connects donors, receivers, and hospitals in real-time so that no life is lost due to the lack of blood. Join a growing network of heroes today.
//                 </p>

//                 <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-up" style={{ animationDelay: '0.5s' }}>
//                   <Link
//                     to={user ? (user.role === 'donor' ? '/donor/dashboard' : '/search-donors') : '/register'}
//                     className="group relative inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-8 rounded-xl text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 transform overflow-hidden"
//                   >
//                     <span className="absolute inset-0 bg-gradient-to-r from-blue-800 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//                     <FaHeartbeat className="text-lg relative z-10 group-hover:animate-pulse-soft" />
//                     <span className="relative z-10">Become a Donor</span>
//                   </Link>
//                   <button
//                     type="button"
//                     onClick={() => scrollToSection('how-it-works')}
//                     className="group inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 hover:border-blue-300 font-semibold py-3 px-8 rounded-xl text-base md:text-lg transition-all duration-300 hover:-translate-y-1 transform shadow-md hover:shadow-lg"
//                   >
//                     How it works
//                     <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
//                   </button>
//                 </div>

//                 <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 animate-fade-up" style={{ animationDelay: '0.6s' }}>
//                   <button type="button" onClick={() => scrollToSection('stats')} className="hover:text-blue-700 underline-offset-4 hover:underline transition-colors">
//                     View impact statistics
//                   </button>
//                   <span className="hidden sm:inline-block text-gray-300">|</span>
//                   <Link to={user ? '/blood-request' : '/register'} className="inline-flex items-center gap-2 hover:text-blue-700 transition-colors group">
//                     <FaSearch className="group-hover:scale-110 transition-transform" />
//                     Request Blood Now
//                   </Link>
//                 </div>
//               </div>

//               {/* Right Dashboard Preview Card */}
//               <div className="relative lg:block animate-fade-up-delayed">
//                 <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-300 p-6 md:p-8 max-w-md mx-auto animate-float hover:scale-105 transition-transform duration-300" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
//                   <div className="flex items-center justify-between mb-4">
//                     <div>
//                       <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Live Overview</p>
//                       <p className="text-lg font-semibold text-gray-800">BloodBridge Network</p>
//                     </div>
//                     <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-medium animate-pulse-soft">
//                       <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
//                       Online
//                     </span>
//                   </div>
//                   <div className="grid grid-cols-3 gap-3 mb-6">
//                     <div className="bg-orange-100 rounded-2xl p-3 text-center hover:scale-110 transition-transform duration-300 cursor-pointer">
//                       <p className="text-xs text-gray-500 mb-1">Registered</p>
//                       <p className="text-xl font-bold text-blue-700">1.2k</p>
//                       <p className="text-[11px] text-gray-500 mt-1">Active donors</p>
//                     </div>
//                     <div className="bg-orange-100 rounded-2xl p-3 text-center hover:scale-110 transition-transform duration-300 cursor-pointer">
//                       <p className="text-xs text-gray-500 mb-1">Requests</p>
//                       <p className="text-xl font-bold text-orange-600">320</p>
//                       <p className="text-[11px] text-gray-500 mt-1">This month</p>
//                     </div>
//                     <div className="bg-cyan-100 rounded-2xl p-3 text-center hover:scale-110 transition-transform duration-300 cursor-pointer">
//                       <p className="text-xs text-gray-500 mb-1">Fulfilled</p>
//                       <p className="text-xl font-bold text-cyan-700">89%</p>
//                       <p className="text-[11px] text-gray-500 mt-1">Success rate</p>
//                     </div>
//                   </div>

//                   <div className="space-y-3">
//                     <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors group cursor-pointer">
//                       <div className="flex items-center gap-3">
//                         <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
//                           <FaUsers className="text-blue-700" />
//                         </div>
//                         <div>
//                           <p className="text-sm font-medium text-gray-800">Instant donor match</p>
//                           <p className="text-xs text-gray-500">Search donors by blood group & location</p>
//                         </div>
//                       </div>
//                       <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full animate-pulse-soft">Live</span>
//                     </div>
//                     <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors group cursor-pointer">
//                       <div className="flex items-center gap-3">
//                         <div className="w-9 h-9 rounded-full bg-cyan-50 flex items-center justify-center group-hover:scale-110 transition-transform">
//                           <FaHospitalAlt className="text-cyan-700" />
//                         </div>
//                         <div>
//                           <p className="text-sm font-medium text-gray-800">Hospital inventory view</p>
//                           <p className="text-xs text-gray-500">Hospitals manage and share blood stock</p>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors group cursor-pointer">
//                       <div className="flex items-center gap-3">
//                         <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
//                           <FaShieldAlt className="text-gray-700" />
//                         </div>
//                         <div>
//                           <p className="text-sm font-medium text-gray-800">Secure & private</p>
//                           <p className="text-xs text-gray-500">Only verified hospitals access requests</p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Stats Section */}
//         <section id="stats" ref={statsRef} className="bg-white border-y border-gray-300 relative overflow-hidden">
//           <div className="container mx-auto px-4 py-10 md:py-14 relative z-10">
//             <div className={`grid md:grid-cols-4 gap-8 text-center transition-all duration-1000 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
//               {[
//                 { icon: FaHandHoldingHeart, label: 'Lives touched', value: livesCount, suffix: '+', desc: 'Successful matches', bg: 'bg-orange-100', color: 'text-orange-700' },
//                 { icon: FaUsers, label: 'Donor network', value: donorsCount, suffix: '+', desc: 'Verified donors', bg: 'bg-blue-100', color: 'text-blue-700' },
//                 { icon: FaHospitalAlt, label: 'Hospitals', value: hospitalsCount, suffix: '+', desc: 'Partner institutions', bg: 'bg-cyan-100', color: 'text-cyan-700' },
//                 { icon: FaClock, label: 'Average response', value: responseTime, suffix: ' min', desc: 'To find a compatible donor', bg: 'bg-gray-100', color: 'text-gray-700' },
//               ].map((stat, idx) => (
//                 <div key={idx} className="transition-all duration-500 hover:-translate-y-2 hover:scale-105" style={{ transitionDelay: `${idx * 100}ms` }}>
//                   <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${stat.bg} mb-4 group hover:bg-opacity-90 transition-colors`}>
//                     <stat.icon className={`text-2xl ${stat.color} group-hover:scale-110 transition-transform`} />
//                   </div>
//                   <p className="text-sm uppercase tracking-wide text-gray-500 mb-1">{stat.label}</p>
//                   <p className={`text-3xl md:text-4xl font-extrabold ${stat.color} mb-1`}>{stat.value}{stat.suffix}</p>
//                   <p className="text-xs text-gray-500 mt-1">{stat.desc}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* How It Works Section */}
//         <section id="how-it-works" ref={howItWorksRef} className="bg-gradient-to-br from-gray-100 via-white to-gray-100 relative overflow-hidden">
//           <div className="container mx-auto px-4 py-14 md:py-20">
//             <div className={`max-w-3xl mx-auto text-center mb-10 transition-all duration-1000 ${howItWorksVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
//               <p className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">How BloodBridge works</p>
//               <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">One platform for donors, receivers, and hospitals</h2>
//               <p className="text-gray-600">We keep the flow of blood donations simple, transparent, and fast by bringing every stakeholder to a single coordinated platform.</p>
//             </div>
//             <div className="grid md:grid-cols-3 gap-8">
//               {[
//                 { step: '1', title: 'Register in seconds', desc: 'Choose your role as a donor, receiver, or hospital. Fill in your basic details and blood group to join the network.', note: 'Donors stay in control of availability and can pause anytime.' },
//                 { step: '2', title: 'Create or match requests', desc: 'Receivers and hospitals create blood requests, and BloodBridge instantly finds compatible donors by group and location.', note: 'No backend here – data is demo only.' },
//                 { step: '3', title: 'Coordinate and donate', desc: 'Use the dashboards to track requests, view inventory, and coordinate donations seamlessly.', note: 'Frontend-only concept, ready for backend integration.' },
//               ].map((item, idx) => (
//                 <div key={idx} className={`bg-white rounded-2xl shadow-lg p-6 relative overflow-hidden transition-all duration-700 hover:shadow-xl hover:-translate-y-2 transform ${howItWorksVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${idx * 200}ms` }}>
//                   <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-bl-full animate-pulse-soft" />
//                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-4 relative group hover:scale-110 transition-transform">
//                     <span className="font-bold text-blue-700 text-lg">{item.step}</span>
//                     <div className="absolute inset-0 rounded-xl bg-blue-700 opacity-0 group-hover:opacity-20 transition-opacity" />
//                   </div>
//                   <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
//                   <p className="text-gray-600 text-sm mb-2">{item.desc}</p>
//                   <p className="text-xs text-gray-400">{item.note}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* Testimonials Section */}
//         <section id="testimonials" ref={testimonialsRef} className="bg-white relative overflow-hidden py-14 md:py-20">
//           <div className={`max-w-4xl mx-auto text-center mb-10 transition-all duration-1000 ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
//             <p className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">Testimonials</p>
//             <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Stories from our community</h2>
//           </div>
//           <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
//             {[
//               { name: 'Anita R.', role: 'Donor', msg: 'I saved 3 lives in one month. The platform is amazing and super easy to use!' },
//               { name: 'Ramesh K.', role: 'Receiver', msg: 'Found a donor within minutes. BloodBridge made a stressful time easier.' },
//               { name: 'City Hospital', role: 'Partner', msg: 'Our hospital inventory is always up to date. Coordination has never been simpler.' },
//             ].map((t, idx) => (
//               <div key={idx} className={`bg-cyan-50 rounded-2xl shadow-lg p-6 transition-all duration-700 hover:shadow-xl hover:-translate-y-2 transform ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${idx * 200}ms` }}>
//                 <p className="text-gray-800 italic mb-4">"{t.msg}"</p>
//                 <p className="font-semibold text-gray-900">{t.name}</p>
//                 <p className="text-xs text-gray-500">{t.role}</p>
//               </div>
//             ))}
//           </div>
//         </section>

//         {/* Hospital Registration Pricing Section */}
//         <section id="hospital-pricing" className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
//           <div className="container mx-auto px-4">
//             <div className="text-center mb-12">
//               <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
//                 Hospital Registration Pricing
//               </h2>
//               <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//                 Choose the perfect plan for your hospital to connect with our blood donation network.
//               </p>
//             </div>

//             <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
//               {/* Basic Plan */}
//               <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-200 p-8">
//                 <div className="text-center mb-8">
//                   <h3 className="text-2xl font-bold text-gray-900 mb-6">Basic</h3>
//                   <div className="mb-6">
//                     <span className="text-5xl font-extrabold text-gray-900">Rs 2,500</span>
//                     <span className="text-xl text-gray-600">/month</span>
//                   </div>
//                 </div>

//                 <ul className="space-y-4 mb-10">
//                   {[
//                     "Access to routine urgency patients",
//                     "Basic blood request management",
//                     "Email notifications",
//                     "Monthly reports",
//                     "24/7 support",
//                   ].map((feature, idx) => (
//                     <li key={idx} className="flex items-start gap-3">
//                       <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
//                       </svg>
//                       <span className="text-gray-700">{feature}</span>
//                     </li>
//                   ))}
//                 </ul>

//                 <button className="w-full py-4 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition-colors">
//                   Get Started
//                 </button>
//               </div>

//               {/* Standard Plan - Popular */}
//               <div className="relative bg-gradient-to-br from-red-600 to-red-700 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-4 transform scale-105 z-10 text-white p-8">
//                 <div className="absolute -top-5 left-1/2 -translate-x-1/2">
//                   <span className="inline-block px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg">
//                     Popular
//                   </span>
//                 </div>

//                 <div className="text-center mb-8 mt-4">
//                   <h3 className="text-2xl font-bold mb-6">Standard</h3>
//                   <div className="mb-6">
//                     <span className="text-5xl font-extrabold">Rs 7,500</span>
//                     <span className="text-xl opacity-90">/month</span>
//                   </div>
//                 </div>

//                 <ul className="space-y-4 mb-10">
//                   {[
//                     "All Basic features",
//                     "Access to urgent level patients",
//                     "Advanced matching algorithm",
//                     "SMS notifications",
//                     "Real-time dashboard",
//                     "Weekly reports",
//                   ].map((feature, idx) => (
//                     <li key={idx} className="flex items-start gap-3">
//                       <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
//                       </svg>
//                       <span className="text-white/90">{feature}</span>
//                     </li>
//                   ))}
//                 </ul>

//                 <button className="w-full py-4 rounded-xl bg-white text-red-600 font-bold hover:bg-gray-100 transition-colors shadow-lg">
//                   Choose Standard
//                 </button>
//               </div>

//               {/* Advanced Plan */}
//               <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-200 p-8">
//                 <div className="text-center mb-8">
//                   <h3 className="text-2xl font-bold text-gray-900 mb-6">Advanced</h3>
//                   <div className="mb-6">
//                     <span className="text-5xl font-extrabold text-gray-900">Rs 15,000</span>
//                     <span className="text-xl text-gray-600">/month</span>
//                   </div>
//                 </div>

//                 <ul className="space-y-4 mb-10">
//                   {[
//                     "All Standard features",
//                     "Access to emergency level patients",
//                     "Priority donor matching",
//                     "Emergency alert system",
//                     "Custom reporting",
//                     "API access",
//                   ].map((feature, idx) => (
//                     <li key={idx} className="flex items-start gap-3">
//                       <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
//                       </svg>
//                       <span className="text-gray-700">{feature}</span>
//                     </li>
//                   ))}
//                 </ul>

//                 <button className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:shadow-xl transition-all hover:scale-105">
//                   Choose Advanced
//                 </button>
//               </div>
//             </div>

//             <div className="text-center mt-12">
//               <p className="text-sm text-gray-500">
//                 All plans include secure data handling, verified donor access, and dedicated support.
//               </p>
//             </div>
//           </div>
//         </section>

//         {/* Map Section */}
//         <section id="map-section" className="py-16 md:py-24 bg-gray-50">
//           <div className="container mx-auto px-4">
//             <div className="text-center mb-12">
//               <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
//                 Find Nearby Donors & Hospitals
//               </h2>
//               <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//                 Locate blood resources instantly across your city. Our interactive map shows active donors and partner hospitals in real-time.
//               </p>
//             </div>

//             <div className="relative max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-2xl">
//               <div className="aspect-w-16 aspect-h-9 w-full h-96 md:h-[600px]">
//                 <iframe
//                   title="BloodBridge Network Map"
//                   src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d317718.093586738!2d144.755927!3d-37.82222!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad65d43f6e3e6d9%3A0x5045675218ce6e0!2sMelbourne%20VIC%2C%20Australia!5e0!3m2!1sen!2sus!4v1699000000000"
//                   width="100%"
//                   height="100%"
//                   style={{ border: 0 }}
//                   allowFullScreen=""
//                   loading="lazy"
//                   referrerPolicy="no-referrer-when-downgrade"
//                   className="rounded-3xl"
//                 ></iframe>
//               </div>

//               <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg">
//                 <div className="flex items-center gap-3">
//                   <FaHeartbeat className="text-3xl text-red-600 animate-pulse" />
//                   <div>
//                     <p className="text-sm font-medium text-gray-600">Live Network</p>
//                     <p className="text-lg font-bold text-gray-900">1,200+ Active Donors Nearby</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="text-center mt-8">
//               <Link
//                 to="/search-donors"
//                 className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-all hover:shadow-lg"
//               >
//                 <FaSearch />
//                 Search Donors by Location
//               </Link>
//             </div>
//           </div>
//         </section>

//         {/* Share Your Experience Form Section */}
//         <section id="share-experience" className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
//           <div className="container mx-auto px-4 max-w-4xl">
//             <div className="text-center mb-12">
//               <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
//                 Share Your Experience
//               </h2>
//               <p className="text-xl text-gray-600">
//                 Help others by sharing how BloodBridge made a difference in your life.
//               </p>
//             </div>

//             <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-200">
//               <form className="space-y-8">
//                 {/* Name and Email */}
//                 <div className="grid md:grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-lg font-semibold text-gray-800 mb-2">Your Name <span className="text-red-500">*</span></label>
//                     <input
//                       type="text"
//                       required
//                       placeholder="Enter your name"
//                       className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-700"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-lg font-semibold text-gray-800 mb-2">Email (Optional)</label>
//                     <input
//                       type="email"
//                       placeholder="your@email.com"
//                       className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-700"
//                     />
//                   </div>
//                 </div>

//                 {/* Rating */}
//                 <div>
//                   <label className="block text-lg font-semibold text-gray-800 mb-4">Rating <span className="text-red-500">*</span></label>
//                   <div className="flex gap-3 justify-center">
//                     {[1, 2, 3, 4, 5].map((star) => (
//                       <button
//                         key={star}
//                         type="button"
//                         className="text-4xl hover:scale-110 transition-transform"
//                       >
//                         ★
//                       </button>
//                     ))}
//                   </div>
//                   <p className="text-center text-sm text-red-500 mt-2 hidden">Please select a rating</p>
//                 </div>

//                 {/* Experience */}
//                 <div>
//                   <label className="block text-lg font-semibold text-gray-800 mb-2">Your Experience <span className="text-red-500">*</span></label>
//                   <textarea
//                     required
//                     rows="6"
//                     placeholder="Share how BloodBridge helped you or your experience as a donor..."
//                     className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-700 resize-none"
//                   ></textarea>
//                 </div>

//                 {/* Photo Upload */}
//                 <div>
//                   <label className="block text-lg font-semibold text-gray-800 mb-2">Photo (Optional)</label>
//                   <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
//                     <input type="file" accept="image/*" className="hidden" id="photo-upload" />
//                     <label htmlFor="photo-upload" className="cursor-pointer">
//                       <span className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
//                         Choose File
//                       </span>
//                       <p className="mt-3 text-gray-500">No file chosen</p>
//                     </label>
//                   </div>
//                 </div>

//                 {/* Submit Button */}
//                 <div className="text-center pt-6">
//                   <button
//                     type="submit"
//                     className="px-12 py-4 bg-red-600 text-white font-bold text-lg rounded-xl hover:bg-red-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
//                   >
//                     Submit Review
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </section>

//         {/* Final CTA Section - With Call Ambulance Button */}
//         <section id="cta" ref={ctaRef} className="bg-gradient-to-r from-blue-500 via-cyan-500 to-orange-500 relative overflow-hidden py-16 md:py-20">
//           <div className={`container mx-auto px-4 text-center transition-all duration-1000 ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
//             <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join BloodBridge Today</h2>
//             <p className="text-white text-lg md:text-xl mb-6 max-w-xl mx-auto">
//               Be part of a network that saves lives daily. Whether donating, requesting, or managing blood, your contribution matters.
//             </p>

//             <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
//               {/* Get Started Button */}
//               <Link
//                 to={user ? '/donor/dashboard' : '/register'}
//                 className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold py-3 px-8 rounded-xl text-lg md:text-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
//               >
//                 <FaHeartbeat className="text-xl" />
//                 Get Started
//               </Link>

//               {/* Call Ambulance Button */}
//               <a
//                 href="tel:108" // Change to your country's emergency number if needed (e.g., tel:911)
//                 className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-xl text-lg md:text-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
//               >
//                 <FaAmbulance className="text-xl" />
//                 Call Ambulance
//               </a>
//             </div>
//           </div>
//         </section>
//       </main>

//       <Footer />
//     </div>
//   )
// }

// export default Home

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaHeartbeat, FaSearch, FaHospitalAlt, FaShieldAlt, FaUsers, FaArrowRight, FaHandHoldingHeart, FaClock, FaAmbulance } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useCounter } from '../hooks/useCounter'

function Home({ user, onLogout }) {
  const [scrollY, setScrollY] = useState(0)

  // Scroll animation refs
  const [statsRef, statsVisible] = useScrollAnimation({ threshold: 0.2 })
  const [howItWorksRef, howItWorksVisible] = useScrollAnimation({ threshold: 0.1 })
  const [testimonialsRef, testimonialsVisible] = useScrollAnimation({ threshold: 0.1 })
  const [pastEventsRef, pastEventsVisible] = useScrollAnimation({ threshold: 0.1 })
  const [ctaRef, ctaVisible] = useScrollAnimation({ threshold: 0.2 })

  // Animated counters
  const livesCount = useCounter(5200, 2000, statsVisible)
  const donorsCount = useCounter(1200, 2000, statsVisible)
  const hospitalsCount = useCounter(75, 1500, statsVisible)
  const responseTime = useCounter(15, 1500, statsVisible)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-100 via-white to-white overflow-x-hidden">
      <Navbar user={user} onLogout={onLogout} />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-[90vh] flex items-center">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-60 animate-float-slow" style={{ transform: `translateY(${scrollY * 0.3}px)` }} />
            <div className="absolute bottom-0 -left-20 w-72 h-72 bg-orange-100 rounded-full blur-3xl opacity-40 animate-float" style={{ transform: `translateY(${scrollY * 0.2}px)` }} />
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-100 rounded-full blur-3xl opacity-30 animate-float-slow" style={{ transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.15}px)` }} />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-40 animate-float" style={{ left: `${20 + i * 15}%`, top: `${30 + i * 10}%`, animationDelay: `${i * 0.5}s`, animationDuration: `${4 + i}s` }} />
            ))}
          </div>

          <div className="relative container mx-auto px-4 py-16 md:py-24 lg:py-28 z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Text */}
              <div className="animate-fade-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-5 animate-scale-in">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-soft" />
                  Trusted community blood donation platform
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                  <span className="inline-block animate-fade-up" style={{ animationDelay: '0.1s' }}>Donate Blood,</span>
                  <br />
                  <span className="text-blue-700 inline-block animate-fade-up" style={{ animationDelay: '0.2s' }}>Save Lives,</span>
                  <br />
                  <span className="text-gray-800 inline-block animate-fade-up" style={{ animationDelay: '0.3s' }}>Build a Lifeline Network.</span>
                </h1>

                <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-xl animate-fade-up" style={{ animationDelay: '0.4s' }}>
                  BloodBridge connects donors, receivers, and hospitals in real-time so that no life is lost due to the lack of blood. Join a growing network of heroes today.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-up" style={{ animationDelay: '0.5s' }}>
                  <Link
                    to={user ? (user.role === 'donor' ? '/donor/dashboard' : '/search-donors') : '/register'}
                    className="group relative inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-8 rounded-xl text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 transform overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-800 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <FaHeartbeat className="text-lg relative z-10 group-hover:animate-pulse-soft" />
                    <span className="relative z-10">Become a Donor</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => scrollToSection('how-it-works')}
                    className="group inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 hover:border-blue-300 font-semibold py-3 px-8 rounded-xl text-base md:text-lg transition-all duration-300 hover:-translate-y-1 transform shadow-md hover:shadow-lg"
                  >
                    How it works
                    <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 animate-fade-up" style={{ animationDelay: '0.6s' }}>
                  <button type="button" onClick={() => scrollToSection('stats')} className="hover:text-blue-700 underline-offset-4 hover:underline transition-colors">
                    View impact statistics
                  </button>
                  <span className="hidden sm:inline-block text-gray-300">|</span>
                  <Link to={user ? '/blood-request' : '/register'} className="inline-flex items-center gap-2 hover:text-blue-700 transition-colors group">
                    <FaSearch className="group-hover:scale-110 transition-transform" />
                    Request Blood Now
                  </Link>
                </div>
              </div>

              {/* Right Dashboard Preview Card */}
              <div className="relative lg:block animate-fade-up-delayed">
                <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-300 p-6 md:p-8 max-w-md mx-auto animate-float hover:scale-105 transition-transform duration-300" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Live Overview</p>
                      <p className="text-lg font-semibold text-gray-800">BloodBridge Network</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-medium animate-pulse-soft">
                      <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                      Online
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-orange-100 rounded-2xl p-3 text-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                      <p className="text-xs text-gray-500 mb-1">Registered</p>
                      <p className="text-xl font-bold text-blue-700">1.2k</p>
                      <p className="text-[11px] text-gray-500 mt-1">Active donors</p>
                    </div>
                    <div className="bg-orange-100 rounded-2xl p-3 text-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                      <p className="text-xs text-gray-500 mb-1">Requests</p>
                      <p className="text-xl font-bold text-orange-600">320</p>
                      <p className="text-[11px] text-gray-500 mt-1">This month</p>
                    </div>
                    <div className="bg-cyan-100 rounded-2xl p-3 text-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                      <p className="text-xs text-gray-500 mb-1">Fulfilled</p>
                      <p className="text-xl font-bold text-cyan-700">89%</p>
                      <p className="text-[11px] text-gray-500 mt-1">Success rate</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FaUsers className="text-blue-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Instant donor match</p>
                          <p className="text-xs text-gray-500">Search donors by blood group & location</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full animate-pulse-soft">Live</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-cyan-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FaHospitalAlt className="text-cyan-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Hospital inventory view</p>
                          <p className="text-xs text-gray-500">Hospitals manage and share blood stock</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FaShieldAlt className="text-gray-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Secure & private</p>
                          <p className="text-xs text-gray-500">Only verified hospitals access requests</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" ref={statsRef} className="bg-white border-y border-gray-300 relative overflow-hidden">
          <div className="container mx-auto px-4 py-10 md:py-14 relative z-10">
            <div className={`grid md:grid-cols-4 gap-8 text-center transition-all duration-1000 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {[
                { icon: FaHandHoldingHeart, label: 'Lives touched', value: livesCount, suffix: '+', desc: 'Successful matches', bg: 'bg-orange-100', color: 'text-orange-700' },
                { icon: FaUsers, label: 'Donor network', value: donorsCount, suffix: '+', desc: 'Verified donors', bg: 'bg-blue-100', color: 'text-blue-700' },
                { icon: FaHospitalAlt, label: 'Hospitals', value: hospitalsCount, suffix: '+', desc: 'Partner institutions', bg: 'bg-cyan-100', color: 'text-cyan-700' },
                { icon: FaClock, label: 'Average response', value: responseTime, suffix: ' min', desc: 'To find a compatible donor', bg: 'bg-gray-100', color: 'text-gray-700' },
              ].map((stat, idx) => (
                <div key={idx} className="transition-all duration-500 hover:-translate-y-2 hover:scale-105" style={{ transitionDelay: `${idx * 100}ms` }}>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${stat.bg} mb-4 group hover:bg-opacity-90 transition-colors`}>
                    <stat.icon className={`text-2xl ${stat.color} group-hover:scale-110 transition-transform`} />
                  </div>
                  <p className="text-sm uppercase tracking-wide text-gray-500 mb-1">{stat.label}</p>
                  <p className={`text-3xl md:text-4xl font-extrabold ${stat.color} mb-1`}>{stat.value}{stat.suffix}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" ref={howItWorksRef} className="bg-gradient-to-br from-gray-100 via-white to-gray-100 relative overflow-hidden">
          <div className="container mx-auto px-4 py-14 md:py-20">
            <div className={`max-w-3xl mx-auto text-center mb-10 transition-all duration-1000 ${howItWorksVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <p className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">How BloodBridge works</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">One platform for donors, receivers, and hospitals</h2>
              <p className="text-gray-600">We keep the flow of blood donations simple, transparent, and fast by bringing every stakeholder to a single coordinated platform.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Register in seconds', desc: 'Choose your role as a donor, receiver, or hospital. Fill in your basic details and blood group to join the network.', note: 'Donors stay in control of availability and can pause anytime.' },
                { step: '2', title: 'Create or match requests', desc: 'Receivers and hospitals create blood requests, and BloodBridge instantly finds compatible donors by group and location.', note: 'No backend here – data is demo only.' },
                { step: '3', title: 'Coordinate and donate', desc: 'Use the dashboards to track requests, view inventory, and coordinate donations seamlessly.', note: 'Frontend-only concept, ready for backend integration.' },
              ].map((item, idx) => (
                <div key={idx} className={`bg-white rounded-2xl shadow-lg p-6 relative overflow-hidden transition-all duration-700 hover:shadow-xl hover:-translate-y-2 transform ${howItWorksVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${idx * 200}ms` }}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-bl-full animate-pulse-soft" />
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-4 relative group hover:scale-110 transition-transform">
                    <span className="font-bold text-blue-700 text-lg">{item.step}</span>
                    <div className="absolute inset-0 rounded-xl bg-blue-700 opacity-0 group-hover:opacity-20 transition-opacity" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{item.desc}</p>
                  <p className="text-xs text-gray-400">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" ref={testimonialsRef} className="bg-white relative overflow-hidden py-14 md:py-20">
          <div className={`max-w-4xl mx-auto text-center mb-10 transition-all duration-1000 ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <p className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Stories from our community</h2>
          </div>
          <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
            {[
              { name: 'Anita R.', role: 'Donor', msg: 'I saved 3 lives in one month. The platform is amazing and super easy to use!' },
              { name: 'Ramesh K.', role: 'Receiver', msg: 'Found a donor within minutes. BloodBridge made a stressful time easier.' },
              { name: 'City Hospital', role: 'Partner', msg: 'Our hospital inventory is always up to date. Coordination has never been simpler.' },
            ].map((t, idx) => (
              <div key={idx} className={`bg-cyan-50 rounded-2xl shadow-lg p-6 transition-all duration-700 hover:shadow-xl hover:-translate-y-2 transform ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${idx * 200}ms` }}>
                <p className="text-gray-800 italic mb-4">"{t.msg}"</p>
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Past Donation Events Section - FIXED IMAGES */}
        <section id="past-events" ref={pastEventsRef} className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className={`text-center mb-12 transition-all duration-1000 ${pastEventsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Past Donation Events
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Celebrating successful blood donation campaigns that brought our community together to save lives.
              </p>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto transition-all duration-1000 ${pastEventsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Fixed Image 1 */}
              <div className="group relative cursor-pointer overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
                <img
                  src="https://c.ndtvimg.com/2025-06/5371lv2_adani-group-blood-donation-drive-_625x300_25_June_25.jpeg"
                  alt="Large community blood donation drive with many donors"
                  className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                  <div>
                    <p className="text-white font-bold text-lg">Adani Group Mega Drive</p>
                    <p className="text-white/80 text-sm">27,661 units collected</p>
                  </div>
                </div>
              </div>

              {/* Fixed Image 2 */}
              <div className="group relative cursor-pointer overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
                <img
                  src="https://www.shutterstock.com/image-photo/surat-gujarat-indiaapril-27-2025-600nw-2622820221.jpg"
                  alt="Medical staff assisting donors in blood camp"
                  className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                  <div>
                    <p className="text-white font-bold text-lg">Surat Community Camp</p>
                    <p className="text-white/80 text-sm">Dedicated medical team</p>
                  </div>
                </div>
              </div>

              {/* Image 3 */}
              <div className="group relative cursor-pointer overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
                <img
                  src="https://npr.brightspotcdn.com/d2/95/57312a3e414bb60e8498c06a47e7/fairfield-donors.JPG"
                  alt="High school students in blood donation drive"
                  className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                  <div>
                    <p className="text-white font-bold text-lg">High School Blood Drive</p>
                    <p className="text-white/80 text-sm">Young heroes saving lives</p>
                  </div>
                </div>
              </div>

              {/* Image 4 */}
              <div className="group relative cursor-pointer overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
                <img
                  src="https://nursing.georgetown.edu/wp-content/uploads/2023/10/Blood-Drive-Students-Simulator-1024x768.jpg"
                  alt="Nursing students organizing blood drive"
                  className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                  <div>
                    <p className="text-white font-bold text-lg">Georgetown Nursing Drive</p>
                    <p className="text-white/80 text-sm">Second successful event</p>
                  </div>
                </div>
              </div>

              {/* Image 5 */}
              <div className="group relative cursor-pointer overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
                <img
                  src="https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_2/v1744297714/unionpsorg/m07sivyb5cjp6byl1wax/490718285_1044932271023992_3055873174380779185_n.jpg"
                  alt="Union High School blood donation camp"
                  className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                  <div>
                    <p className="text-white font-bold text-lg">Union High School Camp</p>
                    <p className="text-white/80 text-sm">Students giving back</p>
                  </div>
                </div>
              </div>

              {/* Image 6 */}
              <div className="group relative cursor-pointer overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
                <img
                  src="https://c.ndtvimg.com/2025-06/5371lv2_adani-group-blood-donation-drive-_625x300_25_June_25.jpeg"
                  alt="Rows of donors at community blood drive"
                  className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                  <div>
                    <p className="text-white font-bold text-lg">LifeSouth Community Drive</p>
                    <p className="text-white/80 text-sm">AB donors in action</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-10">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-all hover:shadow-lg"
              >
                View All Events
                <FaArrowRight />
              </Link>
            </div>
          </div>
        </section>

        {/* Hospital Registration Pricing Section */}
        <section id="hospital-pricing" className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Hospital Registration Pricing
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the perfect plan for your hospital to connect with our blood donation network.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Basic Plan */}
              <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-200 p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Basic</h3>
                  <div className="mb-6">
                    <span className="text-5xl font-extrabold text-gray-900">Rs 2,500</span>
                    <span className="text-xl text-gray-600">/month</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-10">
                  {[
                    "Access to routine urgency patients",
                    "Basic blood request management",
                    "Email notifications",
                    "Monthly reports",
                    "24/7 support",
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className="w-full py-4 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition-colors">
                  Get Started
                </button>
              </div>

              {/* Standard Plan - Popular */}
              <div className="relative bg-gradient-to-br from-red-600 to-red-700 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-4 transform scale-105 z-10 text-white p-8">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <span className="inline-block px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg">
                    Popular
                  </span>
                </div>

                <div className="text-center mb-8 mt-4">
                  <h3 className="text-2xl font-bold mb-6">Standard</h3>
                  <div className="mb-6">
                    <span className="text-5xl font-extrabold">Rs 7,500</span>
                    <span className="text-xl opacity-90">/month</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-10">
                  {[
                    "All Basic features",
                    "Access to urgent level patients",
                    "Advanced matching algorithm",
                    "SMS notifications",
                    "Real-time dashboard",
                    "Weekly reports",
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-white/90">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className="w-full py-4 rounded-xl bg-white text-red-600 font-bold hover:bg-gray-100 transition-colors shadow-lg">
                  Choose Standard
                </button>
              </div>

              {/* Advanced Plan */}
              <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-200 p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Advanced</h3>
                  <div className="mb-6">
                    <span className="text-5xl font-extrabold text-gray-900">Rs 15,000</span>
                    <span className="text-xl text-gray-600">/month</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-10">
                  {[
                    "All Standard features",
                    "Access to emergency level patients",
                    "Priority donor matching",
                    "Emergency alert system",
                    "Custom reporting",
                    "API access",
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:shadow-xl transition-all hover:scale-105">
                  Choose Advanced
                </button>
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-sm text-gray-500">
                All plans include secure data handling, verified donor access, and dedicated support.
              </p>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section id="map-section" className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Find Nearby Donors & Hospitals
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Locate blood resources instantly across your city. Our interactive map shows active donors and partner hospitals in real-time.
              </p>
            </div>

            <div className="relative max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-2xl">
              <div className="w-full h-96 md:h-[600px]">
                <iframe
                  title="BloodBridge Network Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d317718.093586738!2d144.755927!3d-37.82222!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad65d43f6e3e6d9%3A0x5045675218ce6e0!2sMelbourne%20VIC%2C%20Australia!5e0!3m2!1sen!2sus!4v1699000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-3xl"
                ></iframe>
              </div>

              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <FaHeartbeat className="text-3xl text-red-600 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Live Network</p>
                    <p className="text-lg font-bold text-gray-900">1,200+ Active Donors Nearby</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link
                to="/search-donors"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-all hover:shadow-lg"
              >
                <FaSearch />
                Search Donors by Location
              </Link>
            </div>
          </div>
        </section>

        {/* Share Your Experience Form Section */}
        <section id="share-experience" className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Share Your Experience
              </h2>
              <p className="text-xl text-gray-600">
                Help others by sharing how BloodBridge made a difference in your life.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-200">
              <form className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-2">Your Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-2">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-4">Rating <span className="text-red-500">*</span></label>
                  <div className="flex gap-3 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="text-4xl hover:scale-110 transition-transform"
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-2">Your Experience <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    rows="6"
                    placeholder="Share how BloodBridge helped you or your experience as a donor..."
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-700 resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-2">Photo (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                    <input type="file" accept="image/*" className="hidden" id="photo-upload" />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <span className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                        Choose File
                      </span>
                      <p className="mt-3 text-gray-500">No file chosen</p>
                    </label>
                  </div>
                </div>

                <div className="text-center pt-6">
                  <button
                    type="submit"
                    className="px-12 py-4 bg-red-600 text-white font-bold text-lg rounded-xl hover:bg-red-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="cta" ref={ctaRef} className="bg-gradient-to-r from-blue-500 via-cyan-500 to-orange-500 relative overflow-hidden py-16 md:py-20">
          <div className={`container mx-auto px-4 text-center transition-all duration-1000 ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join BloodBridge Today</h2>
            <p className="text-white text-lg md:text-xl mb-6 max-w-xl mx-auto">
              Be part of a network that saves lives daily. Whether donating, requesting, or managing blood, your contribution matters.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to={user ? '/donor/dashboard' : '/register'}
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold py-3 px-8 rounded-xl text-lg md:text-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
              >
                <FaHeartbeat className="text-xl" />
                Get Started
              </Link>

              <a
                href="tel:108"
                className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-xl text-lg md:text-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
              >
                <FaAmbulance className="text-xl" />
                Call Ambulance
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home