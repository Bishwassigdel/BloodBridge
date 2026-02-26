// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaHeartbeat,
  FaSearch,
  FaHospitalAlt,
  FaUsers,
  FaArrowRight,
  FaClock,
  FaAmbulance,
  FaArrowUp,
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useCounter } from '../hooks/useCounter';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { user, logout } = useAuth();

  const [scrollY, setScrollY] = useState(0);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const navigate = useNavigate();

  const [statsRef, statsVisible] = useScrollAnimation({ threshold: 0.2 });
  const [howItWorksRef, howItWorksVisible] = useScrollAnimation({ threshold: 0.1 });
  const [testimonialsRef, testimonialsVisible] = useScrollAnimation({ threshold: 0.1 });
  const [pastEventsRef, pastEventsVisible] = useScrollAnimation({ threshold: 0.1 });
  const [ctaRef, ctaVisible] = useScrollAnimation({ threshold: 0.2 });

  const donorsCount = useCounter(1200, 2000, statsVisible);
  const hospitalsCount = useCounter(75, 1500, statsVisible);
  const responseTime = useCounter(15, 1500, statsVisible);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Protected navigation for blood request buttons
  const handleRequestBlood = (isEmergency = false) => {
    const targetPath = isEmergency 
      ? '/blood-request?mode=emergency' 
      : '/blood-request';

    if (!user) {
      navigate('/login', {
        state: { from: { pathname: targetPath } },
      });
    } else {
      navigate(targetPath);
    }
  };

  const pastEvents = [
    {
      src: "https://c.ndtvimg.com/2025-06/5371lv2_adani-group-blood-donation-drive-_625x300_25_June_25.jpeg",
      alt: "Large community blood donation drive with many donors",
      title: "Adani Group Mega Drive",
      desc: "27,661 units collected",
    },
    {
      src: "https://www.shutterstock.com/image-photo/surat-gujarat-indiaapril-27-2025-600nw-2622820221.jpg",
      alt: "Medical staff assisting donors in blood camp",
      title: "Surat Community Camp",
      desc: "Dedicated medical team",
    },
    {
      src: "https://npr.brightspotcdn.com/d2/95/57312a3e414bb60e8498c06a47e7/fairfield-donors.JPG",
      alt: "High school students in blood donation drive",
      title: "High School Blood Drive",
      desc: "Young heroes saving lives",
    },
    {
      src: "https://nursing.georgetown.edu/wp-content/uploads/2023/10/Blood-Drive-Students-Simulator-1024x768.jpg",
      alt: "Nursing students organizing blood drive",
      title: "Georgetown Nursing Drive",
      desc: "Second successful event",
    },
    {
      src: "https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_2/v1744297714/unionpsorg/m07sivyb5cjp6byl1wax/490718285_1044932271023992_3055873174380779185_n.jpg",
      alt: "Union High School blood donation camp",
      title: "Union High School Camp",
      desc: "Students giving back",
    },
    {
      src: "https://c.ndtvimg.com/2025-06/5371lv2_adani-group-blood-donation-drive-_625x300_25_June_25.jpeg",
      alt: "Rows of donors at community blood drive",
      title: "LifeSouth Community Drive",
      desc: "AB donors in action",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-red-50 via-white to-white overflow-x-hidden">
      <Navbar user={user} onLogout={logout} />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-[90vh] flex items-center">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute -top-40 -right-40 w-80 h-80 bg-red-200 rounded-full blur-3xl opacity-60 animate-float-slow"
              style={{ transform: `translateY(${scrollY * 0.3}px)` }}
            />
            <div
              className="absolute bottom-0 -left-20 w-72 h-72 bg-rose-100 rounded-full blur-3xl opacity-40 animate-float"
              style={{ transform: `translateY(${scrollY * 0.2}px)` }}
            />
            <div
              className="absolute top-1/2 left-1/2 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-30 animate-float-slow"
              style={{ transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.15}px)` }}
            />
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-red-400 rounded-full opacity-40 animate-float"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + i * 10}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${4 + i}s`,
                }}
              />
            ))}
          </div>

          <div className="relative container mx-auto px-4 py-16 md:py-24 lg:py-28 z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Text */}
              <div className="animate-fade-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-5 animate-scale-in">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-soft" />
                  Trusted community blood donation platform
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                  <span className="inline-block animate-fade-up" style={{ animationDelay: '0.1s' }}>
                    Donate Blood,
                  </span>
                  <br />
                  <span className="text-red-700 inline-block animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    Save Lives,
                  </span>
                  <br />
                  <span className="text-gray-800 inline-block animate-fade-up" style={{ animationDelay: '0.3s' }}>
                    Build a Lifeline Network.
                  </span>
                </h1>

                <p
                  className="text-lg md:text-xl text-gray-700 mb-8 max-w-xl animate-fade-up"
                  style={{ animationDelay: '0.4s' }}
                >
                  BloodBridge connects donors, receivers, and hospitals in real-time so that no life is lost due to the lack of blood. Join a growing network of heroes today.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-up" style={{ animationDelay: '0.5s' }}>
                  <button
                    onClick={() => handleRequestBlood(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 flex items-center justify-center gap-2 text-lg md:text-xl"
                  >
                    <FaAmbulance className="text-xl md:text-2xl" />
                    Emergency
                  </button>

                  <button
                    onClick={() => handleRequestBlood(false)}
                    className="group relative inline-flex items-center justify-center gap-2 bg-white text-red-700 border-2 border-red-700 hover:bg-red-50 hover:border-red-800 font-semibold py-4 px-10 rounded-xl text-lg md:text-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
                  >
                    <FaSearch className="text-xl relative z-10 group-hover:scale-110 transition-transform" />
                    <span className="relative z-10 font-bold">Request Blood</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 animate-fade-up" style={{ animationDelay: '0.6s' }}>
                  <button
                    type="button"
                    onClick={() => scrollToSection('stats')}
                    className="hover:text-red-700 underline-offset-4 hover:underline transition-colors"
                  >
                    View impact statistics
                  </button>
                  <span className="hidden sm:inline-block text-gray-300">|</span>
                  <button
                    onClick={() => handleRequestBlood(false)}
                    className="inline-flex items-center gap-2 hover:text-red-700 transition-colors group"
                  >
                    <FaSearch className="group-hover:scale-110 transition-transform" />
                    Request Blood Now
                  </button>
                </div>
              </div>

              {/* Right Dashboard Preview Card */}
              <div className="relative lg:block animate-fade-up-delayed">
                <div
                  className="relative bg-white rounded-3xl shadow-2xl border border-red-200 p-6 md:p-8 max-w-md mx-auto animate-float hover:scale-105 transition-transform duration-300"
                  style={{ transform: `translateY(${scrollY * 0.1}px)` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Live Overview</p>
                      <p className="text-lg font-semibold text-gray-800">BloodBridge Network</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium animate-pulse-soft">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Online
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-red-50 rounded-2xl p-3 text-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                      <p className="text-xs text-gray-500 mb-1">Registered</p>
                      <p className="text-xl font-bold text-red-700">1.2k</p>
                      <p className="text-[11px] text-gray-500 mt-1">Active donors</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-3 text-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                      <p className="text-xs text-gray-500 mb-1">Requests</p>
                      <p className="text-xl font-bold text-red-600">320</p>
                      <p className="text-[11px] text-gray-500 mt-1">This month</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-3 text-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                      <p className="text-xs text-gray-500 mb-1">Fulfilled</p>
                      <p className="text-xl font-bold text-red-700">89%</p>
                      <p className="text-[11px] text-gray-500 mt-1">Success rate</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-red-50 rounded-xl p-3 hover:bg-red-100 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FaUsers className="text-red-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Instant donor match</p>
                          <p className="text-xs text-gray-500">Search donors by blood group & location</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full animate-pulse-soft">
                        Live
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" ref={statsRef} className="bg-white border-y border-red-100 relative overflow-hidden">
          <div className="container mx-auto px-4 py-10 md:py-14 relative z-10">
            <div
              className={`grid md:grid-cols-3 gap-8 text-center transition-all duration-1000 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              {[
                { icon: FaUsers, label: 'Donor network', value: donorsCount, suffix: '+', desc: 'Verified donors', bg: 'bg-red-50', color: 'text-red-700' },
                { icon: FaHospitalAlt, label: 'Hospitals', value: hospitalsCount, suffix: '+', desc: 'Partner institutions', bg: 'bg-red-50', color: 'text-red-700' },
                { icon: FaClock, label: 'Average response', value: responseTime, suffix: ' min', desc: 'To find a compatible donor', bg: 'bg-red-50', color: 'text-red-700' },
              ].map((stat, idx) => (
                <div key={idx} className="transition-all duration-500 hover:-translate-y-2 hover:scale-105" style={{ transitionDelay: `${idx * 100}ms` }}>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${stat.bg} mb-4 group hover:bg-red-100 transition-colors`}>
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
        <section id="how-it-works" ref={howItWorksRef} className="bg-gradient-to-br from-red-50 via-white to-red-50 relative overflow-hidden">
          <div className="container mx-auto px-4 py-14 md:py-20">
            <div
              className={`max-w-3xl mx-auto text-center mb-10 transition-all duration-1000 ${howItWorksVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <p className="text-sm font-semibold text-red-700 mb-2 uppercase tracking-wide">How BloodBridge works</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">One platform for donors, receivers, and hospitals</h2>
              <p className="text-gray-600">We keep the flow of blood donations simple, transparent, and fast by bringing every stakeholder to a single coordinated platform.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Register in seconds', desc: 'Choose your role as a donor, receiver, or hospital. Fill in your basic details and blood group to join the network.' },
                { step: '2', title: 'Create or match requests', desc: 'Receivers and hospitals create blood requests, and BloodBridge instantly finds compatible donors by group and location.' },
                { step: '3', title: 'Coordinate and donate', desc: 'Use the dashboards to track requests, view inventory, and coordinate donations seamlessly.' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl shadow-lg p-6 relative overflow-hidden transition-all duration-700 hover:shadow-xl hover:-translate-y-2 transform ${howItWorksVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  style={{ transitionDelay: `${idx * 200}ms` }}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-red-100 rounded-bl-full animate-pulse-soft" />
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center mb-4 relative group hover:scale-110 transition-transform">
                    <span className="font-bold text-red-700 text-lg">{item.step}</span>
                    <div className="absolute inset-0 rounded-xl bg-red-700 opacity-0 group-hover:opacity-20 transition-opacity" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" ref={testimonialsRef} className="bg-white relative overflow-hidden py-14 md:py-20">
          <div
            className={`max-w-4xl mx-auto text-center mb-10 transition-all duration-1000 ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <p className="text-sm font-semibold text-red-700 mb-2 uppercase tracking-wide">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Stories from our community</h2>
          </div>
          <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
            {[
              { name: 'Anita R.', role: 'Donor', msg: 'I saved 3 lives in one month. The platform is amazing and super easy to use!' },
              { name: 'Ramesh K.', role: 'Receiver', msg: 'Found a donor within minutes. BloodBridge made a stressful time easier.' },
              { name: 'City Hospital', role: 'Partner', msg: 'Our hospital inventory is always up to date. Coordination has never been simpler.' },
            ].map((t, idx) => (
              <div
                key={idx}
                className={`bg-red-50 rounded-2xl shadow-lg p-6 transition-all duration-700 hover:shadow-xl hover:-translate-y-2 transform ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${idx * 200}ms` }}
              >
                <p className="text-gray-800 italic mb-4">"{t.msg}"</p>
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Past Donation Events Section */}
        <section id="past-events" ref={pastEventsRef} className="py-16 md:py-24 bg-gradient-to-b from-red-50 to-white">
          <div className="container mx-auto px-4">
            <div
              className={`text-center mb-12 transition-all duration-1000 ${pastEventsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Past Donation Events</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Celebrating successful blood donation campaigns that brought our community together to save lives.
              </p>
            </div>

            <div
              className={`grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto transition-all duration-1000 ${pastEventsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              {pastEvents.slice(0, showAllEvents ? 6 : 3).map((event, idx) => (
                <div
                  key={idx}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3"
                >
                  <img
                    src={event.src}
                    alt={event.alt}
                    className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                    <div>
                      <p className="text-white font-bold text-lg">{event.title}</p>
                      <p className="text-white/80 text-sm">{event.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <button
                onClick={() => setShowAllEvents(!showAllEvents)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all hover:shadow-lg"
              >
                {showAllEvents ? 'View Less' : 'View All Events'}
                {showAllEvents ? <FaArrowUp /> : <FaArrowRight />}
              </button>
            </div>
          </div>
        </section>

        {/* Hospital Registration Pricing Section */}
        <section id="hospital-pricing" className="py-16 md:py-24 bg-gradient-to-b from-white to-red-50">
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
              <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-red-200 p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Basic</h3>
                  <div className="mb-6">
                    <span className="text-5xl font-extrabold text-gray-900">Rs 2,500</span>
                    <span className="text-xl text-gray-600">/month</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-10">
                  {[
                    'Access to routine urgency patients',
                    'Basic blood request management',
                    'Email notifications',
                    'Monthly reports',
                    '24/7 support',
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-4 rounded-xl bg-red-50 text-red-800 font-semibold hover:bg-red-100 transition-colors">
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
                    'All Basic features',
                    'Access to urgent level patients',
                    'Advanced matching algorithm',
                    'SMS notifications',
                    'Real-time dashboard',
                    'Weekly reports',
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-white/90">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-4 rounded-xl bg-white text-red-600 font-bold hover:bg-red-100 transition-colors shadow-lg">
                  Choose Standard
                </button>
              </div>

              {/* Advanced Plan */}
              <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-red-200 p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Advanced</h3>
                  <div className="mb-6">
                    <span className="text-5xl font-extrabold text-gray-900">Rs 15,000</span>
                    <span className="text-xl text-gray-600">/month</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-10">
                  {[
                    'All Standard features',
                    'Access to emergency level patients',
                    'Priority donor matching',
                    'Emergency alert system',
                    'Custom reporting',
                    'API access',
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold hover:shadow-xl transition-all hover:scale-105">
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
        <section id="map-section" className="py-16 md:py-24 bg-red-50">
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
                />
              </div>
            </div>

            <div className="text-center mt-8">
              <Link
                to="/search-donors"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all hover:shadow-lg"
              >
                <FaSearch />
                Search Donors by Location
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section
          id="cta"
          ref={ctaRef}
          className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 relative overflow-hidden py-16 md:py-20"
        >
          <div
            className={`container mx-auto px-4 text-center transition-all duration-1000 ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join BloodBridge Today</h2>
            <p className="text-white text-lg md:text-xl mb-6 max-w-xl mx-auto">
              Be part of a network that saves lives daily. Whether donating, requesting, or managing blood, your contribution matters.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to={user ? '/donor/dashboard' : '/register'}
                className="inline-flex items-center justify-center gap-2 bg-white text-red-700 font-semibold py-3 px-8 rounded-xl text-lg md:text-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
              >
                <FaHeartbeat className="text-xl" />
                Get Started
              </Link>

              <Link
                to={user ? (user.role === 'donor' ? '/donor/dashboard' : '/search-donors') : '/register'}
                className="inline-flex items-center justify-center gap-2 bg-white text-red-700 border-2 border-red-300 hover:border-red-400 font-semibold py-3 px-8 rounded-xl text-lg md:text-xl transition-all duration-300 hover:-translate-y-1 transform shadow-lg hover:shadow-xl"
              >
                <FaHeartbeat className="text-xl" />
                Become a Donor
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;