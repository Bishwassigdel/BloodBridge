// src/pages/Home.jsx
import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
// Leaflet is ~150 KB — lazy-load it so it doesn't block the initial page paint.
// It only mounts when the user scrolls to the map section.
const MapPicker = lazy(() => import('../components/MapPicker'));
import { bloodGroups } from '../data/dummyData';
import { useGeolocation, calculateDistance } from '../hooks/useGeolocation';
import {
  FaHeartbeat,
  FaSearch,
  FaHospitalAlt,
  FaUsers,
  FaArrowRight,
  FaClock,
  FaAmbulance,
  FaArrowUp,
  FaCheckCircle,
  FaUserPlus,
  FaHandHoldingHeart,
  FaExchangeAlt,
  FaPen,
  FaTimes,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTint,
  FaTrophy,
  FaPlayCircle,
  FaQuoteLeft,
  FaRegSadTear,
  FaImage,
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useCounter } from '../hooks/useCounter';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { user, logout } = useAuth();

  // ── Parallax via refs — NO React state, NO re-renders on scroll ──────────
  // Storing scrollY in state caused the entire 1500-line Home component to
  // re-render on every scroll pixel (60+ times/second). Using refs + direct
  // DOM mutation via requestAnimationFrame keeps the main thread free.
  const parallaxBlob1Ref  = useRef(null);
  const parallaxBlob2Ref  = useRef(null);
  const parallaxBlob3Ref  = useRef(null);
  const parallaxCardRef   = useRef(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);


  // Community stories
  const [showShareModal, setShowShareModal] = useState(false);
  const [storyForm, setStoryForm] = useState({ title: '', message: '' });
  const [storyError, setStoryError] = useState('');
  const [storySuccess, setStorySuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [communityStories, setCommunityStories] = useState([]);
  const [selectedCommunityStory, setSelectedCommunityStory] = useState(null);

  const navigate = useNavigate();

  // Map section state
  const [mapBloodGroup, setMapBloodGroup] = useState('');
  const [mapMode, setMapMode] = useState('donors'); // 'donors' | 'hospitals' | 'requests'
  const [realDonors, setRealDonors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const mapSectionRef = useRef(null);
  const { location: mapUserLocation, loading: mapGpsLoading, getLocation: getMapLocation } = useGeolocation();

  // ── Defer map API calls until the map section scrolls into view ─────────────
  // These are 3 heavy API calls. Firing them on mount blocks the initial paint.
  // IntersectionObserver triggers them only when the user reaches the map section.
  useEffect(() => {
    const el = document.getElementById('map-section');
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setMapLoading(true);
        Promise.all([
          api.get('/api/blood/search-donors', { params: { available: 'true' } })
            .then(r => r.data.donors || []).catch(() => []),
          api.get('/api/auth/hospitals')
            .then(r => r.data.hospitals || []).catch(() => []),
          api.get('/api/blood/active-requests-map')
            .then(r => r.data.requests || []).catch(() => []),
        ]).then(([donorsData, hospitalsData, requestsData]) => {
          setRealDonors(donorsData.filter(d => d.coordinates?.lat && d.coordinates?.lng));
          setHospitals(hospitalsData);
          setActiveRequests(requestsData);
          setMapLoading(false);
        });
      },
      { rootMargin: '300px' } // start loading 300px before the section enters view
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Donor markers — filter by blood group, optionally by GPS radius
  const donorMarkers = useMemo(() => {
    let list = realDonors;
    if (mapBloodGroup) list = list.filter(d => d.bloodGroup === mapBloodGroup);
    if (mapUserLocation) {
      list = list
        .map(d => ({ ...d, distance: calculateDistance(mapUserLocation.lat, mapUserLocation.lng, d.coordinates.lat, d.coordinates.lng) }))
        .filter(d => d.distance <= 20)
        .sort((a, b) => a.distance - b.distance);
    }
    return list.map(d => ({
      id: d._id,
      lat: d.coordinates.lat,
      lng: d.coordinates.lng,
      bloodGroup: d.bloodGroup,
      label: d.username,
      subLabel: d.location || d.address || '',
      phone: d.phone,
      lastDonation: d.lastDonation ? new Date(d.lastDonation).toLocaleDateString() : null,
      distance: d.distance ?? null,
    }));
  }, [realDonors, mapBloodGroup, mapUserLocation]);

  // Hospital markers — with distance if user location is known
  const hospitalMarkers = useMemo(() => hospitals.map(h => {
    const distance = mapUserLocation
      ? calculateDistance(mapUserLocation.lat, mapUserLocation.lng, h.coordinates.lat, h.coordinates.lng)
      : null;
    return {
      id: h._id,
      lat: h.coordinates.lat,
      lng: h.coordinates.lng,
      type: 'hospital',
      label: h.hospitalName || h.username,
      subLabel: h.location || h.address || '',
      phone: h.phone,
      distance,
    };
  }).sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999)), [hospitals, mapUserLocation]);

  // Blood request markers — pulsing pins for active pending/accepted requests
  const requestMarkers = useMemo(() => {
    let list = activeRequests;
    if (mapBloodGroup) list = list.filter(r => r.bloodGroup === mapBloodGroup);
    return list.map(r => ({
      id: r._id,
      lat: r.coordinates.lat,
      lng: r.coordinates.lng,
      type: 'request',
      bloodGroup: r.bloodGroup,
      label: `${r.bloodGroup} needed — ${r.units} unit${r.units > 1 ? 's' : ''}`,
      subLabel: r.hospital || r.location || '',
      phone: r.contactPhone,
      units: r.units,
      urgency: r.urgency,
      isEmergency: r.urgency === 'emergency',
      distance: mapUserLocation
        ? calculateDistance(mapUserLocation.lat, mapUserLocation.lng, r.coordinates.lat, r.coordinates.lng)
        : null,
    }));
  }, [activeRequests, mapBloodGroup, mapUserLocation]);

  const mapMarkers = mapMode === 'donors' ? donorMarkers : mapMode === 'hospitals' ? hospitalMarkers : requestMarkers;

  const [statsRef, statsVisible] = useScrollAnimation({ threshold: 0.2 });
  const [howItWorksRef, howItWorksVisible] = useScrollAnimation({ threshold: 0.1 });
  const [testimonialsRef, testimonialsVisible] = useScrollAnimation({ threshold: 0.1 });
  const [pastEventsRef, pastEventsVisible] = useScrollAnimation({ threshold: 0.1 });
  const [ctaRef, ctaVisible] = useScrollAnimation({ threshold: 0.2 });

  // Live past events — deferred after first paint so hero section loads instantly
  const [livePastEvents, setLivePastEvents] = useState([]);
  useEffect(() => {
    const id = setTimeout(() => {
      api.get('/api/events/past')
        .then(res => { if (res.data.success) setLivePastEvents(res.data.events || []); })
        .catch(() => {});
    }, 300); // yield to browser paint first
    return () => clearTimeout(id);
  }, []);

  // Real platform stats — deferred; stats section is below the fold anyway
  const [realStats, setRealStats] = useState({ donors: 0, hospitals: 0, donations: 0, responseTime: 0, monthlyRequests: 0, successRate: 0 });
  useEffect(() => {
    const id = setTimeout(() => {
      api.get('/api/blood/stats')
        .then(res => { if (res.data.success) setRealStats(res.data.stats); })
        .catch(() => {});
    }, 100);
    return () => clearTimeout(id);
  }, []);

  const donorsCount    = useCounter(realStats.donors,       2000, statsVisible);
  const hospitalsCount = useCounter(realStats.hospitals,    1500, statsVisible);
  const responseTime   = useCounter(realStats.responseTime, 1500, statsVisible);

  useEffect(() => {
    let rafId;
    const handleScroll = () => {
      // Cancel any pending frame so we never queue more than one at a time
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const sy = window.scrollY;
        if (parallaxBlob1Ref.current)
          parallaxBlob1Ref.current.style.transform = `translateY(${sy * 0.3}px)`;
        if (parallaxBlob2Ref.current)
          parallaxBlob2Ref.current.style.transform = `translateY(${sy * 0.2}px)`;
        if (parallaxBlob3Ref.current)
          parallaxBlob3Ref.current.style.transform = `translate(${sy * 0.1}px, ${sy * 0.15}px)`;
        if (parallaxCardRef.current)
          parallaxCardRef.current.style.transform = `translateY(${sy * 0.1}px)`;
      });
    };
    // passive: true lets the browser scroll without waiting for this handler
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Fetch community stories — deferred; stories section is below the fold
  useEffect(() => {
    const id = setTimeout(() => {
      api.get('/api/stories')
        .then(res => { if (res.data.success) setCommunityStories(res.data.stories); })
        .catch(() => {});
    }, 500);
    return () => clearTimeout(id);
  }, []);

  const handleShareStory = async (e) => {
    e.preventDefault();
    setStoryError('');
    if (!storyForm.title.trim() || !storyForm.message.trim()) {
      setStoryError('Please fill in both the title and your story.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/api/stories', storyForm);
      if (res.data.success) {
        const updated = res.data.story;
        setCommunityStories(prev => {
          const exists = prev.find(s => s.author === updated.author || s._id === updated._id);
          if (exists) return prev.map(s => (s._id === updated._id || s.author === updated.author) ? updated : s);
          return [updated, ...prev];
        });
        setStorySuccess('Your story has been shared! Thank you.');
        setStoryForm({ title: '', message: '' });
        setTimeout(() => { setShowShareModal(false); setStorySuccess(''); }, 2000);
      }
    } catch (err) {
      setStoryError(err.response?.data?.message || 'Failed to share story. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    if (role === 'donor') return 'bg-red-50 text-red-700';
    if (role === 'hospital') return 'bg-blue-50 text-blue-700';
    return 'bg-green-50 text-green-700';
  };

  const getRoleLabel = (role) => {
    if (role === 'donor') return 'Donor';
    if (role === 'hospital') return 'Hospital';
    return 'Receiver';
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      date: "June 25, 2025",
      location: "Ahmedabad, Gujarat",
      story: "The Adani Group organized one of the largest single-day blood donation drives in the region, mobilizing thousands of employees and community members across multiple cities. Medical teams were stationed at 12 collection points, ensuring smooth, safe, and efficient donation for every participant.",
      quote: "I never thought donating blood could feel this powerful. Knowing 27,000 lives could be saved — that's something I'll carry forever.",
      quoteName: "Ramesh K., Donor",
      stats: { units: "27,661", donors: "9,200+", cities: "12", hospitals: "38" },
      videoUrl: null,
    },
    {
      src: "https://www.shutterstock.com/image-photo/surat-gujarat-indiaapril-27-2025-600nw-2622820221.jpg",
      alt: "Medical staff assisting donors in blood camp",
      title: "Surat Community Camp",
      desc: "Dedicated medical team",
      date: "April 27, 2025",
      location: "Surat, Gujarat",
      story: "A grassroots initiative led by local doctors and volunteers, the Surat Community Camp brought together over 300 trained medical staff and thousands of willing donors. The camp ran for two days and set a new city record for units collected in a single organized event.",
      quote: "Our team worked non-stop for two days. Seeing the gratitude on donors' faces made every hour worth it.",
      quoteName: "Dr. Priya S., Lead Coordinator",
      stats: { units: "4,800", donors: "1,600+", cities: "1", hospitals: "7" },
      videoUrl: null,
    },
    {
      src: "https://npr.brightspotcdn.com/d2/95/57312a3e414bb60e8498c06a47e7/fairfield-donors.JPG",
      alt: "High school students in blood donation drive",
      title: "High School Blood Drive",
      desc: "Young heroes saving lives",
      date: "March 10, 2025",
      location: "Fairfield, Connecticut",
      story: "Students at Fairfield High organized this blood drive as part of their community service initiative. What started as a class project turned into the school's biggest annual event, with students handling logistics, donor registration, and post-donation care under the guidance of certified nurses.",
      quote: "We're 17 years old and we just helped save lives. That's the coolest thing I've ever done.",
      quoteName: "Maya T., Student Organizer",
      stats: { units: "320", donors: "140+", cities: "1", hospitals: "2" },
      videoUrl: null,
    },
    {
      src: "https://nursing.georgetown.edu/wp-content/uploads/2023/10/Blood-Drive-Students-Simulator-1024x768.jpg",
      alt: "Nursing students organizing blood drive",
      title: "Georgetown Nursing Drive",
      desc: "Second successful event",
      date: "October 15, 2024",
      location: "Washington D.C.",
      story: "Georgetown University's School of Nursing hosted its second annual blood drive, combining academic training with real community impact. Nursing students led the event end-to-end — from donor screening to post-donation refreshments — under faculty supervision, gaining hands-on clinical experience.",
      quote: "This is exactly why I chose nursing. Helping people while learning — it doesn't get better than this.",
      quoteName: "Sarah L., Nursing Student",
      stats: { units: "510", donors: "210+", cities: "1", hospitals: "4" },
      videoUrl: null,
    },
    {
      src: "https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_2/v1744297714/unionpsorg/m07sivyb5cjp6byl1wax/490718285_1044932271023992_3055873174380779185_n.jpg",
      alt: "Union High School blood donation camp",
      title: "Union High School Camp",
      desc: "Students giving back",
      date: "April 08, 2025",
      location: "Union, New Jersey",
      story: "Union High School partnered with the local Red Cross chapter to organize a campus-wide blood donation camp. Teachers, staff, and eligible students all participated, creating a culture of giving that the school principal called 'the most impactful day in our school's recent history.'",
      quote: "When our principal rolled up his sleeve and donated first, every student in line stood a little taller.",
      quoteName: "James O., Student Council President",
      stats: { units: "275", donors: "120+", cities: "1", hospitals: "3" },
      videoUrl: null,
    },
    {
      src: "https://c.ndtvimg.com/2025-06/5371lv2_adani-group-blood-donation-drive-_625x300_25_June_25.jpeg",
      alt: "Rows of donors at community blood drive",
      title: "LifeSouth Community Drive",
      desc: "AB donors in action",
      date: "February 14, 2025",
      location: "Atlanta, Georgia",
      story: "LifeSouth Blood Centers ran a Valentine's Day themed drive focused on rare blood type donors — especially AB negative. The campaign went viral on social media, attracting donors who had never given before. The event exceeded its target by 180%, making it LifeSouth's most successful single-day drive of the year.",
      quote: "I'm AB negative — I always knew my blood was rare, but this event made me realize just how needed I am.",
      quoteName: "Angela M., First-time Donor",
      stats: { units: "1,240", donors: "520+", cities: "3", hospitals: "11" },
      videoUrl: null,
    },
  ];

  // Merge: live DB events first, fall back to static pastEvents if none
  const displayedEvents = livePastEvents.length > 0
    ? livePastEvents.map(ev => ({
        src: ev.image || 'https://c.ndtvimg.com/2025-06/5371lv2_adani-group-blood-donation-drive-_625x300_25_June_25.jpeg',
        alt: ev.title,
        title: ev.title,
        desc: ev.unitsCollected ? `${ev.unitsCollected} units collected` : ev.description,
        date: new Date(ev.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        rawDate: ev.date,
        hospitalName: ev.hospitalName || '',
        bloodGroupsNeeded: ev.bloodGroupsNeeded || [],
        unitsRaw: Number(ev.unitsCollected) || 0,
        donorsRaw: Number(ev.totalDonors) || (ev.rsvps?.filter(r => r.status === 'attending').length || 0),
        location: ev.location,
        story: ev.story || ev.description || 'A successful blood donation event organized by our hospital network.',
        quote: ev.quote || '',
        quoteName: ev.quoteName || '',
        stats: {
          units: ev.unitsCollected ? ev.unitsCollected.toLocaleString() : '—',
          donors: ev.totalDonors ? `${ev.totalDonors}+` : `${ev.rsvps?.filter(r => r.status === 'attending').length || 0}+`,
          cities: '1',
          hospitals: '1',
        },
        videoUrl: null,
      }))
    : pastEvents.map(p => ({
        ...p,
        rawDate: p.date,
        hospitalName: p.hospitalName || '',
        bloodGroupsNeeded: p.bloodGroupsNeeded || [],
        unitsRaw: typeof p.stats?.units === 'string' ? Number(p.stats.units.replace(/[^0-9]/g, '')) || 0 : 0,
        donorsRaw: typeof p.stats?.donors === 'string' ? Number(p.stats.donors.replace(/[^0-9]/g, '')) || 0 : 0,
      }));

  // Find the most-impactful event (highest units) for the "Featured" badge
  const topEventIdx = displayedEvents.reduce(
    (best, ev, i) => (ev.unitsRaw > (displayedEvents[best]?.unitsRaw || 0) ? i : best),
    0
  );

  const sortedFilteredEvents = displayedEvents.map((ev, i) => ({
    ...ev,
    _isFeatured: i === topEventIdx && ev.unitsRaw > 0,
  }));

  // Relative date helper (e.g. "3 weeks ago")
  const relativeDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    const diffMs = Date.now() - d.getTime();
    const days = Math.floor(diffMs / 86400000);
    if (days < 0) return 'soon';
    if (days < 1) return 'today';
    if (days < 2) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? 's' : ''} ago`;
    if (days < 365) return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''} ago`;
    return `${Math.floor(days / 365)} year${days >= 730 ? 's' : ''} ago`;
  };

  const howItWorksSteps = [
    {
      icon: FaUserPlus,
      step: '1',
      title: 'Join in Seconds',
      shortDesc: 'Sign up quickly as a donor, receiver, or hospital with your blood group and location.',
      fullDesc: 'Creating an account takes under a minute. Choose your role — donor, receiver, or hospital — enter your blood group, phone number, and location. Donors can set availability, receivers can save emergency contacts, and hospitals can verify their profile. Once registered, you\'re instantly part of Nepal\'s largest blood lifeline network.',
      color: 'from-red-500 to-rose-600',
    },
    {
      icon: FaExchangeAlt,
      step: '2',
      title: 'Instant Matching',
      shortDesc: 'Real-time matching connects needs with compatible donors instantly.',
      fullDesc: 'When a receiver or hospital posts a request, BloodBridge uses smart matching to find donors with the right blood group and nearby location. Donors get instant notifications, hospitals see real-time inventory updates, and urgent requests are prioritized. The system ensures the fastest possible connection so blood reaches where it\'s needed most.',
      color: 'from-rose-500 to-red-600',
    },
    {
      icon: FaHandHoldingHeart,
      step: '3',
      title: 'Coordinate & Save Lives',
      shortDesc: 'Chat, schedule, and track donations — all in one secure place.',
      fullDesc: 'Once matched, use built-in chat to coordinate pickup time and location. Track donation status, send thank-you messages, and mark successful donations. Hospitals update inventory in real-time, donors earn recognition badges, and every completed donation contributes to saving lives — all managed seamlessly through BloodBridge.',
      color: 'from-red-600 to-rose-700',
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
              ref={parallaxBlob1Ref}
              className="absolute -top-40 -right-40 w-80 h-80 bg-red-200 rounded-full blur-3xl opacity-60 animate-float-slow"
            />
            <div
              ref={parallaxBlob2Ref}
              className="absolute bottom-0 -left-20 w-72 h-72 bg-rose-100 rounded-full blur-3xl opacity-40 animate-float"
            />
            <div
              ref={parallaxBlob3Ref}
              className="absolute top-1/2 left-1/2 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-30 animate-float-slow"
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

                <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-xl animate-fade-up" style={{ animationDelay: '0.4s' }}>
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

              <div className="relative lg:block animate-fade-up-delayed">
                <div
                  ref={parallaxCardRef}
                  className="relative bg-white rounded-3xl shadow-2xl border border-red-200 p-6 md:p-8 max-w-md mx-auto animate-float hover:scale-105 transition-transform duration-300"
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
                      <p className="text-xl font-bold text-red-700">
                        {realStats.donors >= 1000
                          ? `${(realStats.donors / 1000).toFixed(1)}k`
                          : realStats.donors || '—'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">Active donors</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-3 text-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                      <p className="text-xs text-gray-500 mb-1">Requests</p>
                      <p className="text-xl font-bold text-red-600">
                        {realStats.monthlyRequests || '—'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">This month</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-3 text-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                      <p className="text-xs text-gray-500 mb-1">Fulfilled</p>
                      <p className="text-xl font-bold text-red-700">
                        {realStats.monthlyRequests > 0 ? `${realStats.successRate}%` : '—'}
                      </p>
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
                { icon: FaUsers,      label: 'Donor Network',    value: donorsCount,    suffix: '+',   desc: 'Registered donors',        bg: 'bg-red-50', color: 'text-red-700' },
                { icon: FaHospitalAlt,label: 'Hospitals',        value: hospitalsCount, suffix: '+',   desc: 'Partner institutions',     bg: 'bg-red-50', color: 'text-red-700' },
                { icon: FaClock,      label: 'Avg Response',     value: realStats.responseTime > 0 ? responseTime : null, suffix: ' min', desc: 'To find a compatible donor', bg: 'bg-red-50', color: 'text-red-700' },
              ].map((stat, idx) => (
                <div key={idx} className="transition-all duration-500 hover:-translate-y-2 hover:scale-105" style={{ transitionDelay: `${idx * 100}ms` }}>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${stat.bg} mb-4 group hover:bg-red-100 transition-colors`}>
                    <stat.icon className={`text-2xl ${stat.color} group-hover:scale-110 transition-transform`} />
                  </div>
                  <p className="text-sm uppercase tracking-wide text-gray-500 mb-1">{stat.label}</p>
                  <p className={`text-3xl md:text-4xl font-extrabold ${stat.color} mb-1`}>
                    {stat.value !== null ? <>{stat.value}{stat.suffix}</> : '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section – Smaller + Read More Modal */}
        <section id="how-it-works" ref={howItWorksRef} className="bg-gradient-to-br from-red-50 via-white to-rose-50 relative overflow-hidden py-12 md:py-16">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-100 rounded-full blur-3xl opacity-30 animate-float-slow" />
            <div className="absolute -bottom-16 -left-32 w-64 h-64 bg-rose-100 rounded-full blur-3xl opacity-20 animate-float" />
          </div>

          <div className="relative container mx-auto px-4">
            <div
              className={`text-center mb-12 transition-all duration-1000 ${howItWorksVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            >
              <p className="text-sm font-semibold text-red-700 mb-2 uppercase tracking-wider">Simple. Fast. Life-saving.</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                One Platform for Everyone
              </h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                Donors, receivers, and hospitals — all connected in real time.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              {howItWorksSteps.map((item, idx) => {
                const shortDesc = item.fullDesc.length > 100 ? item.fullDesc.substring(0, 100) + '...' : item.fullDesc;

                return (
                  <div
                    key={idx}
                    className={`bg-white rounded-2xl shadow-lg border border-red-100 p-6 transition-all duration-500 hover:shadow-xl hover:-translate-y-3 hover:border-red-200 relative overflow-hidden group ${howItWorksVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                    style={{ transitionDelay: `${idx * 200}ms` }}
                  >
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-red-50 to-rose-50 rounded-full opacity-40 group-hover:opacity-60 transition-opacity" />

                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform`}>
                      <item.icon className="text-2xl text-white" />
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-lg">
                        {item.step}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                    </div>

                    <p className="text-gray-700 text-sm leading-relaxed mb-4">
                      {shortDesc}
                    </p>

                    {item.fullDesc.length > 100 && (
                      <button
                        onClick={() => setSelectedStep(item)}
                        className="text-red-600 font-medium hover:text-red-800 transition flex items-center gap-1.5 text-sm group"
                      >
                        Read more
                        <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Full Step Description Modal */}
            {selectedStep && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-red-100 animate-scale-in">
                  <div className="p-6 md:p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${selectedStep.color} flex items-center justify-center shadow-md`}>
                          <selectedStep.icon className="text-3xl text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{selectedStep.title}</h3>
                          <p className="text-lg text-red-700">Step {selectedStep.step}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-800 text-base leading-relaxed">
                      {selectedStep.fullDesc}
                    </p>

                    <div className="flex justify-center gap-4 mt-8">
                      <button
                        onClick={() => setSelectedStep(null)}
                        className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition shadow-md"
                      >
                        Close
                      </button>
                      {parseInt(selectedStep.step) < howItWorksSteps.length && (
                        <button
                          onClick={() => setSelectedStep(howItWorksSteps[parseInt(selectedStep.step)])}
                          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition shadow-md flex items-center gap-2"
                        >
                          Next <FaArrowRight className="text-sm" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center mt-12">
              <button
                onClick={() => handleRequestBlood(false)}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl hover:shadow-xl hover:scale-[1.03] transition-all duration-300 shadow-lg"
              >
                <FaHeartbeat className="text-2xl" />
                Join the Network Now
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" ref={testimonialsRef} className="bg-gradient-to-br from-red-50 via-white to-rose-50 relative overflow-hidden py-14 md:py-20">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-30 animate-float-slow" />
            <div className="absolute bottom-0 -left-20 w-80 h-80 bg-rose-100 rounded-full blur-3xl opacity-20 animate-float" />
          </div>

          <div className="relative container mx-auto px-4">
            <div
              className={`text-center mb-12 transition-all duration-1000 ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <p className="text-sm font-semibold text-red-700 mb-2 uppercase tracking-wide">Real Stories</p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Stories from our community
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Hear from real donors, receivers, and hospitals who are making a difference every day.
              </p>
            </div>

            {/* Live Community Stories */}
            {communityStories.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg font-medium">No stories yet. Be the first to share yours!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {communityStories.map((story, idx) => {
                  const shortMsg = story.message.length > 120 ? story.message.substring(0, 120) + '...' : story.message;
                  const initials = story.name ? story.name.charAt(0).toUpperCase() : '?';
                  return (
                    <div
                      key={story._id}
                      className={`bg-white rounded-3xl shadow-xl border border-red-100 p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 hover:border-red-200 relative overflow-hidden ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                      style={{ transitionDelay: `${idx * 150}ms` }}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        {story.avatar ? (
                          <img src={story.avatar} alt={story.name} className="w-16 h-16 rounded-full object-cover border-4 border-red-100 shadow-md" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-red-100 border-4 border-red-200 flex items-center justify-center text-red-700 font-bold text-2xl shadow-md">
                            {initials}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900">{story.name}</p>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getRoleBadgeColor(story.role)}`}>
                            {getRoleLabel(story.role)}
                          </span>
                        </div>
                      </div>
                      {story.location && (
                        <span className="inline-block mb-3 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                          📍 {story.location}
                        </span>
                      )}
                      <p className="font-semibold text-gray-800 mb-2">{story.title}</p>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">"{shortMsg}"</p>
                      {story.message.length > 120 && (
                        <button
                          onClick={() => setSelectedCommunityStory(story)}
                          className="text-red-600 font-semibold hover:text-red-800 transition flex items-center gap-2 text-sm group"
                        >
                          Read full story
                          <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Share Story Button — bottom */}
            <div className="text-center mt-10">
              <button
                onClick={() => {
                  if (!user) { navigate('/login'); return; }
                  setShowShareModal(true);
                  setStoryError(''); setStorySuccess('');
                }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 text-lg"
              >
                <FaPen className="text-sm" />
                Share Your Story
              </button>
            </div>

            {/* Community Story Full Read Modal */}
            {selectedCommunityStory && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-red-100">
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        {selectedCommunityStory.avatar ? (
                          <img src={selectedCommunityStory.avatar} alt={selectedCommunityStory.name} className="w-16 h-16 rounded-full object-cover border-4 border-red-100" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-red-100 border-4 border-red-200 flex items-center justify-center text-red-700 font-bold text-2xl">
                            {selectedCommunityStory.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{selectedCommunityStory.name}</h3>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getRoleBadgeColor(selectedCommunityStory.role)}`}>
                            {getRoleLabel(selectedCommunityStory.role)}
                          </span>
                          {selectedCommunityStory.location && (
                            <p className="text-sm text-gray-500 mt-1">📍 {selectedCommunityStory.location}</p>
                          )}
                        </div>
                      </div>
                      <button onClick={() => setSelectedCommunityStory(null)} className="text-3xl text-gray-400 hover:text-red-600 transition">
                        <FaTimes />
                      </button>
                    </div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4">{selectedCommunityStory.title}</h4>
                    <p className="text-gray-700 leading-relaxed">"{selectedCommunityStory.message}"</p>
                    <div className="text-center mt-8">
                      <button onClick={() => setSelectedCommunityStory(null)} className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition">
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Share Story Modal */}
            {showShareModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-red-100 animate-scale-in">
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FaPen className="text-red-600" /> Share Your Story
                      </h3>
                      <button onClick={() => setShowShareModal(false)} className="text-3xl text-gray-400 hover:text-red-600 transition">
                        <FaTimes />
                      </button>
                    </div>

                    {storySuccess ? (
                      <div className="text-center py-8">
                        <div className="text-5xl mb-4">🎉</div>
                        <p className="text-green-600 font-semibold text-lg">{storySuccess}</p>
                      </div>
                    ) : (
                      <form onSubmit={handleShareStory} className="space-y-5">
                        {storyError && (
                          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-xl text-sm">
                            {storyError}
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Story Title *</label>
                          <input
                            type="text"
                            placeholder="e.g. How I saved a life by donating blood"
                            value={storyForm.title}
                            onChange={e => setStoryForm(p => ({ ...p, title: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition text-gray-900"
                            maxLength={100}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Your Story *</label>
                          <textarea
                            rows={5}
                            placeholder="Share your experience as a donor, receiver, or hospital..."
                            value={storyForm.message}
                            onChange={e => setStoryForm(p => ({ ...p, message: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition text-gray-900 resize-none"
                            maxLength={1000}
                          />
                          <p className="text-xs text-gray-400 text-right mt-1">{storyForm.message.length}/1000</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowShareModal(false)}
                            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {submitting ? 'Sharing...' : 'Share Story'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* Past Donation Events Section — Advanced */}
        <section id="past-events" ref={pastEventsRef} className="py-16 md:py-24 bg-gradient-to-b from-red-50 via-rose-50/40 to-white relative overflow-hidden">
          {/* Decorative background blobs */}
          <div className="absolute top-20 -left-20 w-80 h-80 bg-red-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 -right-20 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 relative">
            {/* Heading */}
            <div
              className={`text-center mb-10 transition-all duration-1000 ${pastEventsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider mb-4">
                <FaTrophy /> Our Impact Stories
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Past Donation Events</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Celebrating successful blood donation campaigns that brought our community together to save lives.
              </p>
            </div>

            {/* Events Grid */}
            {sortedFilteredEvents.length === 0 ? (
              <div className="max-w-md mx-auto text-center py-16">
                <FaRegSadTear className="text-5xl text-red-200 mx-auto mb-4" />
                <p className="text-gray-700 font-semibold">No events yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Past events will appear here once hospitals complete their drives.
                </p>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 max-w-6xl mx-auto transition-all duration-1000 ${pastEventsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              >
                {sortedFilteredEvents.slice(0, showAllEvents ? sortedFilteredEvents.length : 3).map((event, idx) => (
                  <article
                    key={idx}
                    onClick={() => setSelectedEvent(event)}
                    className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white shadow-md border border-red-100 hover:shadow-2xl hover:border-red-200 transition-all duration-500 hover:-translate-y-2 flex flex-col"
                  >
                    {/* Media */}
                    <div className="relative h-56 overflow-hidden bg-gray-100">
                      {event.videoUrl ? (
                        <iframe
                          width="100%"
                          height="100%"
                          src={event.videoUrl}
                          title={event.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      ) : (
                        <img
                          src={event.src}
                          alt={event.alt}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                      {/* Featured badge */}
                      {event._isFeatured && (
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 text-[11px] font-extrabold shadow-lg">
                          <FaTrophy className="text-[10px]" /> Featured
                        </span>
                      )}

                      {/* Content type indicator */}
                      <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm text-red-600 flex items-center justify-center shadow-md">
                        {event.videoUrl ? <FaPlayCircle /> : <FaImage className="text-sm" />}
                      </span>

                      {/* Date pill */}
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-gray-800 text-[11px] font-bold shadow-md">
                        <FaCalendarAlt className="text-red-500 text-[10px]" />
                        {event.date}
                      </span>

                      {/* Hover overlay */}
                      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                        Read Story <FaArrowRight className="text-[9px]" />
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-lg font-extrabold text-gray-900 leading-tight line-clamp-2 group-hover:text-red-700 transition-colors">
                        {event.title}
                      </h3>

                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <FaMapMarkerAlt className="text-red-400 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                        {event.rawDate && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="whitespace-nowrap">{relativeDate(event.rawDate)}</span>
                          </>
                        )}
                      </div>

                      {event.hospitalName && (
                        <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1.5">
                          <FaHospitalAlt className="text-red-400" /> {event.hospitalName}
                        </p>
                      )}

                      {event.story && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2 leading-relaxed">{event.story}</p>
                      )}

                      {/* Stat strip */}
                      <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 flex items-center gap-2">
                          <FaTint className="text-red-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-base font-extrabold text-red-700 leading-none">{event.stats?.units || '—'}</p>
                            <p className="text-[10px] text-gray-500 font-semibold uppercase mt-0.5">Units</p>
                          </div>
                        </div>
                        <div className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 flex items-center gap-2">
                          <FaUsers className="text-rose-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-base font-extrabold text-rose-700 leading-none">{event.stats?.donors || '—'}</p>
                            <p className="text-[10px] text-gray-500 font-semibold uppercase mt-0.5">Donors</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* View All / Less */}
            {sortedFilteredEvents.length > 3 && (
              <div className="text-center mt-10">
                <button
                  onClick={() => setShowAllEvents(!showAllEvents)}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all hover:shadow-xl hover:scale-105"
                >
                  {showAllEvents ? 'View Less' : `View All ${sortedFilteredEvents.length} Events`}
                  {showAllEvents ? <FaArrowUp /> : <FaArrowRight />}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Past Event Lightbox Modal */}
        {selectedEvent && (
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close X */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-md flex items-center justify-center transition"
                aria-label="Close"
              >
                <FaTimes />
              </button>

              {/* Hero Image */}
              <div className="relative">
                <img
                  src={selectedEvent.src}
                  alt={selectedEvent.alt}
                  className="w-full h-72 object-cover rounded-t-3xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-t-3xl flex items-end p-6">
                  <div className="w-full">
                    {selectedEvent._isFeatured && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 text-[11px] font-extrabold mb-2">
                        <FaTrophy className="text-[10px]" /> Featured Event
                      </span>
                    )}
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">{selectedEvent.title}</h3>
                    <div className="text-white/85 text-sm flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <span className="flex items-center gap-1.5">
                        <FaMapMarkerAlt className="text-red-300" /> {selectedEvent.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FaCalendarAlt className="text-red-300" /> {selectedEvent.date}
                      </span>
                      {selectedEvent.hospitalName && (
                        <span className="flex items-center gap-1.5">
                          <FaHospitalAlt className="text-red-300" /> {selectedEvent.hospitalName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                {/* Blood groups needed */}
                {selectedEvent.bloodGroupsNeeded?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Blood Groups:</span>
                    {selectedEvent.bloodGroupsNeeded.map(g => (
                      <span key={g} className="px-2.5 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-bold">
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Impact Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Units', value: selectedEvent.stats.units, icon: FaTint },
                    { label: 'Donors', value: selectedEvent.stats.donors, icon: FaUsers },
                    { label: 'Cities', value: selectedEvent.stats.cities, icon: FaMapMarkerAlt },
                    { label: 'Hospitals', value: selectedEvent.stats.hospitals, icon: FaHospitalAlt },
                  ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-2xl p-3 text-center">
                        <Icon className="text-red-500 mx-auto mb-1" />
                        <p className="text-lg font-extrabold text-red-600 leading-tight">{s.value}</p>
                        <p className="text-[11px] text-gray-500 font-semibold uppercase">{s.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Story */}
                {selectedEvent.story && (
                  <p className="text-gray-700 text-base leading-relaxed mb-6">{selectedEvent.story}</p>
                )}

                {/* Quote */}
                {selectedEvent.quote && (
                  <div className="relative bg-gradient-to-br from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl p-5 pl-12 mb-6">
                    <FaQuoteLeft className="absolute top-4 left-4 text-red-300 text-xl" />
                    <p className="text-gray-800 italic text-sm leading-relaxed">{selectedEvent.quote}</p>
                    {selectedEvent.quoteName && (
                      <p className="text-red-600 font-semibold text-xs mt-2">— {selectedEvent.quoteName}</p>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

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

        {/* Map Section — OpenStreetMap */}
        <section id="map-section" className="py-16 md:py-24 bg-gradient-to-b from-white to-red-50">
          <div className="container mx-auto px-4">

            {/* Heading */}
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider mb-4">
                <FaMapMarkerAlt /> Live Map
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Find Donors & Hospitals Near You
              </h2>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                Real registered donors and hospitals — powered by OpenStreetMap. Click any pin to call directly.
              </p>
            </div>

            {/* Controls bar */}
            <div className="max-w-5xl mx-auto mb-6 flex flex-wrap gap-3 items-center justify-between bg-white border border-red-100 rounded-2xl px-5 py-4 shadow-md">

              {/* Mode toggle: Donors / Hospitals / Requests */}
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setMapMode('donors')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${mapMode === 'donors' ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  🩸 Donors
                </button>
                <button
                  onClick={() => setMapMode('hospitals')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${mapMode === 'hospitals' ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  🏥 Hospitals
                </button>
                <button
                  onClick={() => setMapMode('requests')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all relative ${mapMode === 'requests' ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  🚨 Requests
                  {activeRequests.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                      {activeRequests.length > 9 ? '9+' : activeRequests.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Blood group filter (donors + requests) */}
              {(mapMode === 'donors' || mapMode === 'requests') && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-semibold text-gray-600 mr-1">Blood:</span>
                  <button
                    onClick={() => setMapBloodGroup('')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${mapBloodGroup === '' ? 'bg-red-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
                  >
                    All
                  </button>
                  {['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(bg => (
                    <button
                      key={bg}
                      onClick={() => setMapBloodGroup(bg === mapBloodGroup ? '' : bg)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${mapBloodGroup === bg ? 'bg-red-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              )}

              {/* Near Me button */}
              <button
                onClick={getMapLocation}
                disabled={mapGpsLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all shadow disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FaMapMarkerAlt />
                {mapGpsLoading ? 'Locating...' : 'Near Me'}
              </button>
            </div>

            {/* Map + sidebar */}
            <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-5">

              {/* Map */}
              <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl border border-red-100 relative">
                {mapLoading && (
                  <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center rounded-2xl">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                      <p className="text-sm text-gray-500 font-medium">Loading real data…</p>
                    </div>
                  </div>
                )}
                <Suspense fallback={
                  <div className="w-full h-[500px] flex items-center justify-center bg-red-50">
                    <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                  </div>
                }>
                  <MapPicker
                    height="500px"
                    center={mapUserLocation ? [mapUserLocation.lat, mapUserLocation.lng] : [27.7172, 85.3240]}
                    zoom={mapUserLocation ? 13 : 12}
                    markers={mapMarkers}
                    userLocation={mapUserLocation}
                    radiusKm={mapMode === 'donors' && mapUserLocation ? 20 : null}
                    markerType={mapMode}
                    flyTo={mapUserLocation ? { lat: mapUserLocation.lat, lng: mapUserLocation.lng } : null}
                    flyZoom={13}
                    fitMarkers={!mapUserLocation && mapMarkers.length > 1}
                    readOnly
                  />
                </Suspense>
              </div>

              {/* Sidebar */}
              <div className="lg:w-64 flex flex-col gap-4">

                {/* Stats card */}
                <div className="bg-white border border-red-100 rounded-2xl p-5 shadow-md">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Map Stats</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full inline-block ${mapMode === 'donors' ? 'bg-red-500' : mapMode === 'hospitals' ? 'bg-purple-600' : 'bg-orange-500'}`} />
                        {mapMode === 'donors' ? 'Donors shown' : mapMode === 'hospitals' ? 'Hospitals shown' : 'Active requests'}
                      </span>
                      <span className="font-extrabold text-gray-900">{mapLoading ? '…' : mapMarkers.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Your location
                      </span>
                      <span className="font-extrabold text-gray-900">{mapUserLocation ? '✅' : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Blood group</span>
                      <span className="font-extrabold text-red-600">{mapBloodGroup || 'All'}</span>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="bg-white border border-red-100 rounded-2xl p-5 shadow-md">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Legend</h4>
                  <div className="space-y-2">
                    {(mapMode === 'donors' ? [
                      { color: '#dc2626', label: 'O± donors' },
                      { color: '#2563eb', label: 'A± donors' },
                      { color: '#16a34a', label: 'B± donors' },
                      { color: '#7c3aed', label: 'AB± donors' },
                      { color: '#2563eb', label: 'You are here', dot: true },
                    ] : mapMode === 'hospitals' ? [
                      { color: '#7c3aed', label: 'Hospital' },
                      { color: '#2563eb', label: 'You are here', dot: true },
                    ] : [
                      { color: '#dc2626', label: 'Normal request' },
                      { color: '#dc2626', label: '🚨 Emergency', pulse: true },
                      { color: '#2563eb', label: 'You are here', dot: true },
                    ]).map(({ color, label, dot }) => (
                      <div key={label} className="flex items-center gap-2 text-sm text-gray-600">
                        <span
                          className="inline-block flex-shrink-0"
                          style={{
                            width: 12, height: 12,
                            borderRadius: '50%',
                            background: color,
                            border: dot ? '2px solid white' : 'none',
                            boxShadow: dot ? '0 0 0 3px rgba(37,99,235,0.3)' : 'none',
                          }}
                        />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <Link
                  to="/search-donors"
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl shadow transition-all hover:shadow-lg text-sm"
                >
                  <FaSearch /> Full Donor Search
                </Link>
              </div>
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