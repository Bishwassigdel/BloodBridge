// src/pages/HospitalDashboard.jsx
import { useState, useEffect , lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { invalidateFrontendCache } from '../services/api';
import {
  FaHeartbeat,
  FaClipboardList,
  FaUsers,
  FaHistory,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaBell,
  FaTint,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSpinner,
  FaRedo,
  FaExclamationCircle,
  FaExchangeAlt,
  FaUser,
  FaCog,
  FaPhone,
  FaMapMarkerAlt,
  FaSearch,
  FaFilter,
  FaBullhorn,
  FaCheckCircle,
  FaLock,
  FaHeart,
  FaEdit,
  FaBan,
  FaHandHoldingHeart,
  FaCalendarPlus,
  FaCalendarAlt,
  FaTrash,
  FaUsers as FaUserGroup,
  FaClock,
  FaPlusCircle,
  FaTimesCircle,
  FaEnvelope,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Toast, { useToast } from '../components/Toast';
const MapPicker = lazy(() => import('../components/MapPicker'));
import { useGeolocation, reverseGeocode } from '../hooks/useGeolocation';
import { usePushNotifications } from '../hooks/usePushNotifications';

function HospitalDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const { permission: pushPermission, supported: pushSupported, requestPermission: requestPush } = usePushNotifications();

  const [activePanel, setActivePanel] = useState('donors');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedGroup, setSelectedGroup] = useState('');
  const [updateUnits, setUpdateUnits] = useState('');
  const [updateReason, setUpdateReason] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Add Unit modal (for +1 button on each blood group card)
  const [addUnitModal, setAddUnitModal] = useState(null); // { bloodGroup }
  const [addUnitExpiryDate, setAddUnitExpiryDate] = useState('');
  const [addUnitLoading, setAddUnitLoading] = useState(false);

  // Toast notifications + custom confirm modal
  const { toasts, remove: removeToast, success: toastSuccess, error: toastError } = useToast();
  const [confirmModal, setConfirmModal] = useState(null);
  const askConfirm = (opts) => new Promise((resolve) => {
    setConfirmModal({
      title: opts.title || 'Are you sure?',
      message: opts.message || '',
      confirmText: opts.confirmText || 'Confirm',
      cancelText: opts.cancelText || 'Cancel',
      tone: opts.tone || 'primary', // 'primary' | 'danger'
      onConfirm: () => { setConfirmModal(null); resolve(true); },
      onCancel:  () => { setConfirmModal(null); resolve(false); },
    });
  });

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [transferGroup, setTransferGroup] = useState('');
  const [transferUnits, setTransferUnits] = useState('');
  const [receiverHospital, setReceiverHospital] = useState('');

  // Blood Requests state
  const [allRequests, setAllRequests] = useState([]);
  const [requestStats, setRequestStats] = useState({ total: 0, emergency: 0, pending: 0, accepted: 0, fulfilledToday: 0 });
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestFilter, setRequestFilter] = useState({ bloodGroup: '', urgency: '', status: '', search: '' });
  const [requestTab, setRequestTab] = useState('all');
  const [postForm, setPostForm] = useState({ bloodGroup: '', units: 1, urgency: 'normal', location: '', contactPhone: '', note: '' });
  const [postLoading, setPostLoading] = useState(false);
  const [postResult, setPostResult] = useState({ msg: '', type: '' });

  // ── GPS hooks for location fields ─────────────────────────────────────────
  const { getLocation: getGpsLoc } = useGeolocation();
  const [postLocGpsLoading,   setPostLocGpsLoading]   = useState(false);
  const [eventLocGpsLoading,  setEventLocGpsLoading]  = useState(false);
  const [postLocGeoSuccess,   setPostLocGeoSuccess]   = useState(false);
  const [eventLocGeoSuccess,  setEventLocGeoSuccess]  = useState(false);
  const [postLocGeocoding,    setPostLocGeocoding]    = useState(false);
  const [eventLocGeocoding,   setEventLocGeocoding]   = useState(false);
  const [showPostLocMap,      setShowPostLocMap]      = useState(false);
  const [showEventLocMap,     setShowEventLocMap]     = useState(false);
  const [postPickedCoords,    setPostPickedCoords]    = useState(null);
  const [eventPickedCoords,   setEventPickedCoords]   = useState(null);
  const [showRequestsMap,     setShowRequestsMap]     = useState(false);

  // Detect GPS and fill a location field; also captures coords
  const detectAndFill = async (setLoading, setter, setSuccess, setGeocoding, setCoords) => {
    setLoading(true);
    setSuccess(false);
    try {
      const coords = await getGpsLoc();
      if (setGeocoding) setGeocoding(true);
      const label  = await reverseGeocode(coords.lat, coords.lng);
      setter(label);
      if (setCoords) setCoords(coords);
      setSuccess(true);
    } catch { /* silently ignore */ }
    setLoading(false);
    if (setGeocoding) setGeocoding(false);
  };

  // Map-pick handler for post request location
  const handlePostLocMapPick = async (coords) => {
    setPostPickedCoords(coords);
    setPostLocGeocoding(true);
    try {
      const label = await reverseGeocode(coords.lat, coords.lng);
      setPostForm(p => ({ ...p, location: label }));
      setPostLocGeoSuccess(true);
    } catch {
      setPostForm(p => ({ ...p, location: `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` }));
    } finally {
      setPostLocGeocoding(false);
    }
  };

  // Map-pick handler for event location
  const handleEventLocMapPick = async (coords) => {
    setEventPickedCoords(coords);
    setEventLocGeocoding(true);
    try {
      const label = await reverseGeocode(coords.lat, coords.lng);
      handleEventFormChange('location', label);
      setEventLocGeoSuccess(true);
    } catch {
      handleEventFormChange('location', `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
    } finally {
      setEventLocGeocoding(false);
    }
  };

  // Edit / Cancel / Fulfill request state
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ bloodGroup: '', units: 1, urgency: 'normal', location: '', contactPhone: '', note: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editResult, setEditResult] = useState({ msg: '', type: '' });
  const [actionLoading, setActionLoading] = useState('');

  // Assign Donor modal state
  const [assignModal, setAssignModal] = useState(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignResult, setAssignResult] = useState({ msg: '', type: '' });
  const [assignDonors, setAssignDonors] = useState([]);
  const [assignDonorsLoading, setAssignDonorsLoading] = useState(false);

  // Donor Network state
  const [donors, setDonors] = useState([]);
  const [donorStats, setDonorStats] = useState({ total: 0, available: 0, cooldown: 0, byBloodGroup: {} });
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [donorFilter, setDonorFilter] = useState({ bloodGroup: '', available: '', search: '' });
  const [alertGroup, setAlertGroup] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertResult, setAlertResult] = useState({ msg: '', type: '' }); // type: 'success' | 'error'
  const [alertIncludeCooldown, setAlertIncludeCooldown] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);

  // ── Events state ─────────────────────────────────────────────────────────
  const BLOOD_GROUPS_OPTIONS = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '', description: '', date: '', time: '', location: '',
    contactPhone: '', bloodGroupsNeeded: ['All'], targetDonors: '',
  });
  const [eventFormLoading, setEventFormLoading] = useState(false);
  const [eventFormResult, setEventFormResult] = useState({ msg: '', type: '' });
  const [editingEvent, setEditingEvent] = useState(null);
  const [cancellingEventId, setCancellingEventId] = useState(null);
  const [completingEvent, setCompletingEvent] = useState(null); // event being marked complete
  const [completeForm, setCompleteForm] = useState({ unitsCollected: '', totalDonors: '', image: '', story: '', quote: '', quoteName: '' });
  const [completeImageFile, setCompleteImageFile] = useState(null);
  const [completeImagePreview, setCompleteImagePreview] = useState('');
  const [completeFormLoading, setCompleteFormLoading] = useState(false);
  const [attendeesEvent, setAttendeesEvent] = useState(null); // event whose attendees we're viewing
  const [attendeesSearch, setAttendeesSearch] = useState('');
  // ─────────────────────────────────────────────────────────────────────────

  const token = localStorage.getItem('token');

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const isAuthenticated = !!token && user?.role === 'hospital';

  const fetchWithAuth = async (url, options = {}) => {
    if (!token) {
      navigate('/login');
      return null;
    }

    try {
      const res = await api.get(url, {
        ...options,
        headers: { 'x-auth-token': token, ...options.headers },
      });
      return res.data;
    } catch (err) {
      if (err.response?.status === 401) {
        logout(); // Clear invalid token
        navigate('/login');
      }
      throw err;
    }
  };

  const fetchInventory = async () => {
    if (!isAuthenticated) {
      setError('Please login as hospital user');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchWithAuth('/api/blood/inventory');
      if (data?.success) {
        setInventory(data.inventory || []);
      } else {
        setError(data?.message || 'Failed to load inventory');
      }
    } catch (err) {
      setError('Error loading inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    if (!isAuthenticated) return;

    setLogsLoading(true);
    try {
      const data = await fetchWithAuth('/api/blood/inventory-logs');
      if (data?.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Logs fetch failed', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;

    setNotificationsLoading(true);
    try {
      const data = await fetchWithAuth('/api/notifications');
      if (data?.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Notifications fetch failed', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // ── Events fetch & actions ───────────────────────────────────────────────
  const fetchEvents = async () => {
    if (!isAuthenticated) return;
    setEventsLoading(true);
    try {
      const res = await api.get('/api/events/mine');
      if (res.data?.success) setEvents(res.data.events || []);
    } catch (err) {
      console.error('Events fetch failed', err);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleEventFormChange = (field, value) => {
    setEventForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleBloodGroup = (group) => {
    setEventForm(prev => {
      if (group === 'All') return { ...prev, bloodGroupsNeeded: ['All'] };
      const without = prev.bloodGroupsNeeded.filter(g => g !== 'All' && g !== group);
      const hasGroup = prev.bloodGroupsNeeded.includes(group);
      return { ...prev, bloodGroupsNeeded: hasGroup ? without : [...without, group] };
    });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setEventFormLoading(true);
    setEventFormResult({ msg: '', type: '' });
    try {
      const payload = { ...eventForm, targetDonors: Number(eventForm.targetDonors) || 0 };
      if (editingEvent) {
        await api.patch(`/api/events/${editingEvent._id}`, payload);
        setEventFormResult({ msg: 'Event updated successfully!', type: 'success' });
      } else {
        const res = await api.post('/api/events', payload);
        setEventFormResult({ msg: res.data.message || 'Event created!', type: 'success' });
      }
      setEventForm({ title: '', description: '', date: '', time: '', location: '', contactPhone: '', bloodGroupsNeeded: ['All'], targetDonors: '' });
      setEditingEvent(null);
      setShowEventForm(false);
      fetchEvents();
    } catch (err) {
      setEventFormResult({ msg: err.response?.data?.message || 'Failed to save event.', type: 'error' });
    } finally {
      setEventFormLoading(false);
    }
  };

  const handleCancelEvent = async (eventId) => {
    const ok = await askConfirm({
      title: 'Cancel this event?',
      message: 'Donors and receivers will not be notified of the cancellation.',
      confirmText: 'Cancel Event',
      cancelText: 'Keep Event',
      tone: 'danger',
    });
    if (!ok) return;
    setCancellingEventId(eventId);
    try {
      await api.delete(`/api/events/${eventId}`);
      setEvents(prev => prev.map(ev => ev._id === eventId ? { ...ev, status: 'cancelled' } : ev));
      toastSuccess('Event cancelled', 'The event has been marked as cancelled.');
    } catch (err) {
      toastError('Could not cancel event', err.response?.data?.message || 'Failed to cancel event.');
    } finally {
      setCancellingEventId(null);
    }
  };

  const handleEditEvent = (ev) => {
    setEditingEvent(ev);
    setEventForm({
      title: ev.title,
      description: ev.description || '',
      date: ev.date ? ev.date.slice(0, 10) : '',
      time: ev.time,
      location: ev.location,
      contactPhone: ev.contactPhone || '',
      bloodGroupsNeeded: ev.bloodGroupsNeeded || ['All'],
      targetDonors: ev.targetDonors || '',
    });
    setShowEventForm(true);
    setEventFormResult({ msg: '', type: '' });
  };
  const handleCompleteImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toastError('Invalid file', 'Please choose an image (jpg, png, webp, etc.).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError('Image too large', 'Please upload an image under 5MB.');
      return;
    }
    setCompleteImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCompleteImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const closeCompleteModal = () => {
    setCompletingEvent(null);
    setCompleteForm({ unitsCollected: '', totalDonors: '', image: '', story: '', quote: '', quoteName: '' });
    setCompleteImageFile(null);
    setCompleteImagePreview('');
  };

  const handleMarkComplete = async (e) => {
    e.preventDefault();
    if (!completingEvent) return;
    setCompleteFormLoading(true);
    try {
      // Send as multipart/form-data so the cover image file (if any) is uploaded.
      const fd = new FormData();
      fd.append('status', 'completed');
      fd.append('unitsCollected', Number(completeForm.unitsCollected) || 0);
      fd.append('totalDonors', Number(completeForm.totalDonors) || 0);
      fd.append('story', completeForm.story || '');
      fd.append('quote', completeForm.quote || '');
      fd.append('quoteName', completeForm.quoteName || '');
      // If user picked a new file, upload it. Otherwise keep any existing URL/path.
      if (completeImageFile) {
        fd.append('image', completeImageFile);
      } else if (completeForm.image) {
        fd.append('image', completeForm.image);
      }

      const res = await api.patch(
        `/api/events/${completingEvent._id}`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const updated = res.data?.event;
      setEvents(prev => prev.map(ev =>
        ev._id === completingEvent._id
          ? (updated ? { ...ev, ...updated } : { ...ev, status: 'completed', ...completeForm })
          : ev
      ));
      closeCompleteModal();
      toastSuccess('Event completed', 'The event has been marked as completed.');
    } catch (err) {
      toastError('Could not complete event', err.response?.data?.message || 'Failed to mark event as completed.');
    } finally {
      setCompleteFormLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const fetchDonors = async (filters = {}) => {
    if (!isAuthenticated) return;
    setDonorsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.bloodGroup) params.append('bloodGroup', filters.bloodGroup);
      if (filters.available !== '') params.append('available', filters.available);
      if (filters.search) params.append('search', filters.search);
      const url = `/api/blood/donors${params.toString() ? '?' + params.toString() : ''}`;
      const data = await fetchWithAuth(url);
      if (data?.success) {
        setDonors(data.donors || []);
        setDonorStats(data.stats || { total: 0, available: 0, cooldown: 0, byBloodGroup: {} });
      }
    } catch (err) {
      console.error('Donors fetch failed', err);
    } finally {
      setDonorsLoading(false);
    }
  };

  const handleSendAlert = async () => {
    if (!alertGroup) return;
    setAlertLoading(true);
    setAlertResult({ msg: '', type: '' });
    try {
      const res = await api.post('/api/blood/donors/alert', {
        bloodGroup: alertGroup,
        message: alertMessage.trim() || undefined,
        allDonors: alertIncludeCooldown,
      }, { headers: { 'x-auth-token': token } });
      setAlertResult({ msg: res.data.message, type: 'success' });
      setAlertMessage('');
      setAlertGroup('');
      setAlertIncludeCooldown(false);
      setShowAlertForm(false);
      // Auto-dismiss success banner after 5 seconds
      setTimeout(() => setAlertResult({ msg: '', type: '' }), 5000);
    } catch (err) {
      setAlertResult({ msg: err.response?.data?.message || 'Failed to send alert.', type: 'error' });
    } finally {
      setAlertLoading(false);
    }
  };

  useEffect(() => {
    // Wait until AuthContext finishes initialising before making any auth decision
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    fetchInventory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (activePanel === 'history' || activePanel === 'inventory') {
      fetchLogs();
    } else if (activePanel === 'notifications') {
      fetchNotifications();
    } else if (activePanel === 'donors') {
      fetchDonors(donorFilter);
    } else if (activePanel === 'requests') {
      fetchAllRequests(requestFilter);
    } else if (activePanel === 'events') {
      fetchEvents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePanel, isAuthenticated]);

  const handleUpdateInventory = async (bloodGroup, units, action, customExpiryDate) => {
    if (!isAuthenticated || !bloodGroup || units <= 0) return;

    if (action === 'subtract') {
      const ok = await askConfirm({
        title: `Remove ${units} unit${units > 1 ? 's' : ''} of ${bloodGroup}?`,
        message: 'This will reduce the available stock for this blood group.',
        confirmText: 'Remove',
        cancelText: 'Cancel',
        tone: 'danger',
      });
      if (!ok) return;
    }

    const effectiveExpiryDate = customExpiryDate !== undefined ? customExpiryDate : expiryDate;

    try {
      await api.post('/api/blood/inventory', {
        bloodGroup,
        units,
        action,
        reason: updateReason || undefined,
        expiryDate: action === 'add' && effectiveExpiryDate ? effectiveExpiryDate : undefined,
      }, {
        headers: { 'x-auth-token': token },
      });

      await fetchInventory();
      await fetchLogs();

      if (action === 'add') {
        toastSuccess(
          `+${units} unit${units > 1 ? 's' : ''} of ${bloodGroup} added`,
          effectiveExpiryDate
            ? `Expires on ${new Date(effectiveExpiryDate).toLocaleDateString()}`
            : 'Inventory updated successfully.'
        );
      } else {
        toastSuccess(
          `-${units} unit${units > 1 ? 's' : ''} of ${bloodGroup} removed`,
          'Inventory updated successfully.'
        );
      }

      setSelectedGroup('');
      setUpdateUnits('');
      setUpdateReason('');
      setExpiryDate('');
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        toastError('Update failed', err.response?.data?.message || 'Could not update inventory.');
      }
    }
  };

  const handleConfirmAddUnit = async () => {
    if (!addUnitModal?.bloodGroup) return;
    if (!addUnitExpiryDate) {
      toastError('Expiry date required', 'Please select an expiry date for the unit being added.');
      return;
    }
    // Block past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(addUnitExpiryDate);
    if (chosen < today) {
      toastError('Invalid expiry date', 'Expiry date cannot be in the past.');
      return;
    }
    setAddUnitLoading(true);
    try {
      await handleUpdateInventory(addUnitModal.bloodGroup, 1, 'add', addUnitExpiryDate);
      setAddUnitModal(null);
      setAddUnitExpiryDate('');
    } finally {
      setAddUnitLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!isAuthenticated || !transferGroup || transferUnits <= 0 || !receiverHospital) return;

    const ok = await askConfirm({
      title: 'Send transfer request?',
      message: `Transfer ${transferUnits} unit${transferUnits > 1 ? 's' : ''} of ${transferGroup} to ${receiverHospital}.`,
      confirmText: 'Send Request',
      cancelText: 'Cancel',
      tone: 'primary',
    });
    if (!ok) return;

    try {
      const response = await api.post('/api/blood/transfer/create', {
        toHospitalEmail: receiverHospital,
        bloodGroup: transferGroup,
        units: parseInt(transferUnits),
        reason: `Blood inventory transfer request`,
      }, {
        headers: { 'x-auth-token': token },
      });

      if (response.data.success) {
        toastSuccess(
          'Transfer request sent',
          `An email was sent to ${receiverHospital}. They have 7 days to accept or reject.`,
          6000
        );
        setTransferGroup('');
        setTransferUnits('');
        setReceiverHospital('');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        toastError('Transfer failed', err.response?.data?.message || 'Please check the hospital email and try again.');
      }
    }
  };

  const fetchAllRequests = async (filters = {}) => {
    if (!isAuthenticated) return;
    setRequestsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.bloodGroup) params.append('bloodGroup', filters.bloodGroup);
      if (filters.urgency) params.append('urgency', filters.urgency);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      const url = `/api/blood/all-requests${params.toString() ? '?' + params.toString() : ''}`;
      const data = await fetchWithAuth(url);
      if (data?.success) {
        setAllRequests(data.requests || []);
        setRequestStats(data.stats || { total: 0, emergency: 0, pending: 0, fulfilledToday: 0 });
      }
    } catch (err) {
      console.error('All requests fetch failed', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handlePostRequest = async (e) => {
    e.preventDefault();
    setPostLoading(true);
    setPostResult({ msg: '', type: '' });
    try {
      const hospitalName = user?.hospitalName || user?.username || 'Hospital';
      const res = await api.post('/api/blood/request', {
        ...postForm,
        hospital: hospitalName,
        location: postForm.location || hospitalName,
      }, { headers: { 'x-auth-token': token } });
      if (res.data.success) {
        setPostResult({ msg: `Request posted! ${res.data.message}`, type: 'success' });
        setPostForm({ bloodGroup: '', units: 1, urgency: 'normal', location: '', contactPhone: '', note: '' });
        fetchAllRequests(requestFilter);
      }
    } catch (err) {
      setPostResult({ msg: err.response?.data?.message || 'Failed to post request.', type: 'error' });
    } finally {
      setPostLoading(false);
    }
  };

  const handleCancelRequest = async (id) => {
    const ok = await askConfirm({
      title: 'Cancel this blood request?',
      message: 'The request will be marked as cancelled and removed from active listings.',
      confirmText: 'Cancel Request',
      cancelText: 'Keep Request',
      tone: 'danger',
    });
    if (!ok) return;
    setActionLoading(id);
    try {
      await api.patch(`/api/blood/${id}/cancel`, {}, { headers: { 'x-auth-token': token } });
      fetchAllRequests(requestFilter);
      toastSuccess('Request cancelled', 'The blood request has been cancelled.');
    } catch (err) {
      toastError('Could not cancel request', err.response?.data?.message || 'Failed to cancel request.');
    } finally {
      setActionLoading('');
    }
  };

  const handleFulfillRequest = async (id) => {
    const ok = await askConfirm({
      title: 'Mark request as fulfilled?',
      message: 'This confirms the donor has delivered blood for this request.',
      confirmText: 'Mark Fulfilled',
      cancelText: 'Cancel',
      tone: 'primary',
    });
    if (!ok) return;
    setActionLoading(id);
    try {
      await api.patch(`/api/blood/${id}/fulfill`, {}, { headers: { 'x-auth-token': token } });
      fetchAllRequests(requestFilter);
      toastSuccess('Request fulfilled', 'The blood request has been marked as fulfilled.');
    } catch (err) {
      toastError('Could not mark as fulfilled', err.response?.data?.message || 'Failed to mark as fulfilled.');
    } finally {
      setActionLoading('');
    }
  };

  const openEditModal = (req) => {
    setEditModal(req);
    setEditForm({
      bloodGroup: req.bloodGroup || '',
      units: req.units || 1,
      urgency: req.urgency || 'normal',
      location: req.location || '',
      contactPhone: req.contactPhone || '',
      note: req.note || '',
    });
    setEditResult({ msg: '', type: '' });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setEditLoading(true);
    setEditResult({ msg: '', type: '' });
    try {
      await api.patch(`/api/blood/${editModal._id}/edit`, editForm, { headers: { 'x-auth-token': token } });
      setEditResult({ msg: 'Request updated successfully!', type: 'success' });
      fetchAllRequests(requestFilter);
      setTimeout(() => setEditModal(null), 1200);
    } catch (err) {
      setEditResult({ msg: err.response?.data?.message || 'Failed to update request.', type: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  // Open assign modal: fetch donors filtered to the request's blood group
  const openAssignModal = async (req) => {
    setAssignModal(req);
    setAssignSearch('');
    setAssignResult({ msg: '', type: '' });
    setAssignDonorsLoading(true);
    try {
      const params = new URLSearchParams({ bloodGroup: req.bloodGroup, available: 'true' });
      const data = await fetchWithAuth(`/api/blood/donors?${params}`);
      setAssignDonors(data?.donors || []);
    } catch {
      setAssignDonors([]);
    } finally {
      setAssignDonorsLoading(false);
    }
  };

  const handleAssignDonor = async (donorId) => {
    if (!assignModal) return;
    setAssignLoading(true);
    setAssignResult({ msg: '', type: '' });
    try {
      const res = await api.patch(
        `/api/blood/${assignModal._id}/assign-donor`,
        { donorId },
        { headers: { 'x-auth-token': token } }
      );
      setAssignResult({ msg: res.data.message, type: 'success' });
      fetchAllRequests(requestFilter);
      setTimeout(() => setAssignModal(null), 1800);
    } catch (err) {
      setAssignResult({
        msg: err.response?.data?.message || 'Failed to assign donor.',
        type: 'error',
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusStyle = (units) => {
    if (units >= 10) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100' };
    if (units >= 1) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100 animate-pulse' };
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100 animate-pulse' };
  };

  const isNearExpiry = (date) => {
    if (!date) return false;
    return new Date(date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  };

  // Show spinner while AuthContext is still initialising (prevents flash of "Please Login")
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl">
          <h2 className="text-3xl font-bold text-blue-600 mb-4">Please Login</h2>
          <p className="text-lg text-gray-700 mb-6">You need to be logged in as a hospital user to access this dashboard.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-white flex">
      <button
        className="md:hidden fixed top-5 left-5 z-50 p-3 bg-white rounded-full shadow-lg hover:bg-blue-50 transition"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <FaTimes className="text-2xl text-blue-600" /> : <FaBars className="text-2xl text-blue-600" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white/95 backdrop-blur-xl shadow-2xl transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-500 ease-in-out border-r border-blue-100`}
      >
        <div className="p-8 border-b border-blue-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-2xl">
              <FaHeartbeat className="text-4xl text-blue-600 animate-heartbeat" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">BloodBridge</h1>
              <p className="text-sm font-medium text-blue-600">Hospital Portal</p>
            </div>
          </div>
          <p className="mt-6 text-base text-gray-700">
            {user?.hospitalName || user?.username || 'Hospital Admin'}
          </p>
        </div>

        <nav className="p-6 space-y-2">
          {[
            { key: 'donors',        icon: FaUsers,         label: 'Donor Network'   },
            { key: 'requests',      icon: FaClipboardList, label: 'Blood Request'   },
            { key: 'inventory',     icon: FaTint,          label: 'Blood Inventory' },
            { key: 'events',        icon: FaCalendarPlus,  label: 'Host Event'      },
            { key: 'history',       icon: FaHistory,       label: 'Activity Log'    },
            { key: 'notifications', icon: FaBell,          label: 'Notification'    },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActivePanel(item.key);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
                activePanel === item.key
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-md'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon className="text-2xl" />
                <span className="text-lg">{item.label}</span>
              </div>
            </button>
          ))}

          <hr className="my-6 border-blue-100" />

          <button
            onClick={() => {
              navigate('/profile/edit');
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 font-medium"
          >
            <FaUser className="text-2xl" />
            <span className="text-lg">Edit Profile</span>
          </button>

          {/* Push notifications */}
          {pushSupported && pushPermission !== 'granted' && (
            <button
              onClick={requestPush}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-blue-600 hover:bg-blue-50 transition-all duration-300 font-medium"
            >
              <span className="text-2xl">🔔</span>
              <span className="text-lg">Enable Alerts</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-blue-600 hover:bg-blue-50 transition-all duration-300 font-medium"
          >
            <FaSignOutAlt className="text-2xl" />
            <span className="text-lg">Logout</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 md:ml-72 p-6 md:p-10 pt-24 md:pt-10">
        {error && (
          <div className="mb-10 p-8 bg-blue-50 border-l-6 border-blue-500 rounded-3xl shadow-xl">
            <div className="flex items-start gap-6">
              <FaExclamationTriangle className="text-5xl text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-blue-800 mb-3">Something went wrong</h3>
                <p className="text-blue-700 text-lg mb-6">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  <FaRedo className="text-xl" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && activePanel === 'inventory' ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <FaSpinner className="text-6xl text-blue-600 animate-spin mb-6" />
            <p className="text-xl font-medium text-gray-700">Loading hospital inventory...</p>
          </div>
        ) : (
          <div className="space-y-12">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Welcome back, <span className="text-blue-600">{user?.hospitalName || user?.username || 'Hospital'}</span>
            </h2>

            {activePanel === 'inventory' && (
              <div className="space-y-12">
                <div className="grid md:grid-cols-5 gap-8">
                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Total Units</h3>
                    <div className="text-5xl font-extrabold text-blue-600">
                      {inventory.reduce((sum, i) => sum + i.units, 0)}
                    </div>
                    <p className="text-lg text-gray-600 mt-3">In Stock</p>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Low Stock</h3>
                    <div className="text-5xl font-extrabold text-yellow-600">
                      {inventory.filter(i => i.units > 0 && i.units < 10).length}
                    </div>
                    <p className="text-lg text-gray-600 mt-3">Groups Need Attention</p>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Critical</h3>
                    <div className="text-5xl font-extrabold text-blue-600">
                      {inventory.filter(i => i.units === 0).length}
                    </div>
                    <p className="text-lg text-gray-600 mt-3">Out of Stock</p>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-orange-100 hover:shadow-2xl transition-all duration-300">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-3">
                      <FaExclamationCircle className="text-orange-600" />
                      Near Expiry (≤7 days)
                    </h3>
                    <div className="text-5xl font-extrabold text-orange-600">
                      {inventory.filter(i => isNearExpiry(i.earliestExpiryDate)).reduce((sum, i) => sum + i.units, 0)}
                    </div>
                    <p className="text-lg text-gray-600 mt-3">Units at risk</p>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-3">
                      <FaHistory className="text-blue-600" />
                      Today's Usage
                    </h3>
                    <div className="text-5xl font-extrabold text-blue-600">
                      {logs.filter(log => {
                        const today = new Date();
                        const logDate = new Date(log.timestamp);
                        return logDate.toDateString() === today.toDateString() && log.action === 'subtract';
                      }).reduce((sum, log) => sum + log.units, 0)}
                    </div>
                    <p className="text-lg text-gray-600 mt-3">Units used today</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((group) => {
                    const item = inventory.find(i => i.bloodGroup === group) || { units: 0 };
                    const { bg, border, text, badge } = getStatusStyle(item.units);
                    const nearExpiry = isNearExpiry(item.earliestExpiryDate);

                    return (
                      <div
                        key={group}
                        className={`p-8 rounded-3xl shadow-xl border ${bg} ${border} hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ${nearExpiry ? 'ring-2 ring-orange-500 ring-offset-2 animate-pulse-slow' : ''}`}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-3xl font-extrabold text-gray-900">{group}</h4>
                          <span className={`px-4 py-1 rounded-full text-sm font-semibold ${badge}`}>
                            {item.units >= 10 ? 'Good' : item.units >= 1 ? 'Low' : 'Critical'}
                          </span>
                        </div>

                        <p className={`text-6xl font-extrabold mb-2 ${text}`}>
                          {item.units}
                        </p>
                        <p className="text-lg text-gray-600 mb-4">Units Available</p>

                        {item.earliestExpiryDate && (
                          <div className="mb-6">
                            <p className="text-sm text-gray-700 mb-1">
                              Earliest expiry: <span className={nearExpiry ? 'text-orange-700 font-bold' : 'font-medium'}>
                                {new Date(item.earliestExpiryDate).toLocaleDateString()}
                              </span>
                            </p>
                            {nearExpiry && (
                              <span className="inline-block px-4 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium animate-pulse">
                                Expires soon – use first!
                              </span>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-gray-500 italic mb-6">
                          Use oldest units first to prevent wastage
                        </p>

                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              setAddUnitExpiryDate('');
                              setAddUnitModal({ bloodGroup: group });
                            }}
                            className="flex-1 py-4 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition text-lg font-medium shadow-md hover:shadow-lg"
                          >
                            +1 Unit
                          </button>
                          <button
                            onClick={() => handleUpdateInventory(group, 1, 'subtract')}
                            disabled={item.units <= 0}
                            className={`flex-1 py-4 rounded-2xl text-lg font-medium transition shadow-md ${
                              item.units <= 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            -1 Unit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-8 mt-12">
                  <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-4">
                    <FaExchangeAlt className="text-blue-600" />
                    Transfer Blood to Another Hospital
                  </h3>

                  <div className="grid md:grid-cols-4 gap-6">
                    <select
                      value={transferGroup || ''}
                      onChange={(e) => setTransferGroup(e.target.value)}
                      className="p-5 border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-lg bg-white/70"
                    >
                      <option value="">Select Blood Group</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="Number of units"
                      min="1"
                      value={transferUnits}
                      onChange={(e) => setTransferUnits(e.target.value ? Number(e.target.value) : '')}
                      className="p-5 border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-lg bg-white/70"
                    />

                    <input
                      type="text"
                      placeholder="Receiver Hospital Name / Email"
                      value={receiverHospital}
                      onChange={(e) => setReceiverHospital(e.target.value)}
                      className="p-5 border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-lg bg-white/70 md:col-span-2"
                    />

                    <button
                      onClick={handleTransfer}
                      disabled={!transferGroup || transferUnits <= 0 || !receiverHospital}
                      className="md:col-span-4 py-5 px-10 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-60 transition shadow-lg hover:shadow-xl text-lg"
                    >
                      Send Transfer Request
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-10 mt-12">
                  <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-4">
                    <FaTint className="text-blue-600 text-4xl" />
                    Bulk Inventory Update
                  </h3>

                  <div className="grid md:grid-cols-5 gap-6">
                    <select
                      value={selectedGroup || ''}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="p-5 border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-lg bg-white/70"
                    >
                      <option value="">Select Blood Group</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="Number of units"
                      min="1"
                      value={updateUnits}
                      onChange={(e) => setUpdateUnits(e.target.value ? Number(e.target.value) : '')}
                      className="p-5 border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-lg bg-white/70"
                    />

                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="p-5 border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-lg bg-white/70"
                    />

                    <input
                      type="text"
                      placeholder="Reason (e.g. restock, emergency, transfer)"
                      value={updateReason}
                      onChange={(e) => setUpdateReason(e.target.value)}
                      className="p-5 border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-lg bg-white/70 md:col-span-2"
                    />

                    <div className="flex gap-4 md:col-span-5">
                      <button
                        onClick={() => {
                          if (selectedGroup && updateUnits > 0) {
                            handleUpdateInventory(selectedGroup, updateUnits, 'add');
                          }
                        }}
                        disabled={!selectedGroup || updateUnits <= 0}
                        className="flex-1 py-5 px-10 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 disabled:opacity-60 transition shadow-lg hover:shadow-xl text-lg"
                      >
                        Add Units
                      </button>

                      <button
                        onClick={() => {
                          if (selectedGroup && updateUnits > 0) {
                            handleUpdateInventory(selectedGroup, updateUnits, 'subtract');
                          }
                        }}
                        disabled={!selectedGroup || updateUnits <= 0}
                        className="flex-1 py-5 px-10 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-60 transition shadow-lg hover:shadow-xl text-lg"
                      >
                        Remove Units
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'history' && (
              <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-10">
                <h3 className="text-4xl font-bold text-gray-900 mb-8 flex items-center gap-4">
                  <FaHistory className="text-blue-600" />
                  Activity History
                </h3>

                {logsLoading ? (
                  <div className="flex justify-center py-12">
                    <FaSpinner className="text-5xl text-blue-600 animate-spin" />
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-xl text-gray-600 text-center py-12">No activity recorded yet.</p>
                ) : (
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    {logs.map((log) => (
                      <div
                        key={log._id}
                        className={`p-6 rounded-2xl border ${
                          log.action === 'add' ? 'bg-green-50 border-green-200' :
                          log.action === 'subtract' ? 'bg-blue-50 border-blue-200' :
                          'bg-purple-50 border-purple-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="font-bold text-lg">
                              {log.action.toUpperCase()} {log.units} units of {log.bloodGroup}
                            </span>
                            {log.reason && (
                              <p className="text-sm text-gray-600 mt-1">Reason: {log.reason}</p>
                            )}
                            {log.action === 'add' && log.expiryDate && (
                              <p className="text-sm text-orange-700 mt-1 font-medium">
                                Expiry set: {new Date(log.expiryDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">
                          By: {log.performedBy?.username || 'System'}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Stock changed: {log.beforeUnits} → {log.afterUnits}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── EVENTS PANEL ───────────────────────────────────────────────────── */}
            {activePanel === 'events' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <FaCalendarPlus className="text-blue-600 text-lg" />
                      </span>
                      Host Blood Donation Drive
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 ml-[52px]">Create events — donors & receivers get notified instantly</p>
                  </div>
                  <button
                    onClick={() => { setShowEventForm(v => !v); setEditingEvent(null); setEventForm({ title: '', description: '', date: '', time: '', location: '', contactPhone: '', bloodGroupsNeeded: ['All'], targetDonors: '' }); setEventFormResult({ msg: '', type: '' }); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-sm"
                  >
                    <FaCalendarPlus />
                    {showEventForm ? 'Close Form' : 'Create Event'}
                  </button>
                </div>

                {/* Create / Edit Form */}
                {showEventForm && (
                  <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-8">
                    <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <FaCalendarAlt className="text-blue-500" />
                      {editingEvent ? 'Edit Event' : 'New Blood Donation Drive'}
                    </h4>

                    {eventFormResult.msg && (
                      <div className={`mb-5 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${eventFormResult.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}>
                        {eventFormResult.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
                        {eventFormResult.msg}
                      </div>
                    )}

                    <form onSubmit={handleCreateEvent} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Event Title <span className="text-blue-500">*</span></label>
                          <input
                            type="text"
                            value={eventForm.title}
                            onChange={e => handleEventFormChange('title', e.target.value)}
                            placeholder="e.g. World Blood Donor Day Drive 2025"
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                          <textarea
                            value={eventForm.description}
                            onChange={e => handleEventFormChange('description', e.target.value)}
                            rows={3}
                            placeholder="Tell donors what this event is about..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Date <span className="text-blue-500">*</span></label>
                          <input
                            type="date"
                            value={eventForm.date}
                            onChange={e => handleEventFormChange('date', e.target.value)}
                            min={new Date().toISOString().slice(0,10)}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Time <span className="text-blue-500">*</span></label>
                          <input
                            type="text"
                            value={eventForm.time}
                            onChange={e => handleEventFormChange('time', e.target.value)}
                            placeholder="e.g. 9:00 AM – 4:00 PM"
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Location <span className="text-blue-500">*</span>
                            <span className="ml-1 text-blue-400 text-xs font-normal">(click 📍 to detect)</span>
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => detectAndFill(setEventLocGpsLoading, (v) => handleEventFormChange('location', v), setEventLocGeoSuccess, setEventLocGeocoding, setEventPickedCoords)}
                              disabled={eventLocGpsLoading || eventLocGeocoding}
                              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 group disabled:cursor-not-allowed"
                              title="Detect live location"
                            >
                              {eventLocGpsLoading || eventLocGeocoding
                                ? <span className="w-3.5 h-3.5 border border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
                                : eventLocGeoSuccess
                                  ? <span className="text-green-500 text-sm">📍</span>
                                  : <span className="text-gray-400 group-hover:text-blue-500 group-hover:scale-125 transition-all text-sm">📍</span>
                              }
                            </button>
                            <input
                              type="text"
                              value={eventForm.location}
                              onChange={e => { handleEventFormChange('location', e.target.value); setEventLocGeoSuccess(false); }}
                              placeholder="Click 📍 or type venue…"
                              required
                              className={`w-full pl-9 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                                eventLocGeoSuccess
                                  ? 'border-green-400 focus:ring-green-200'
                                  : 'border-gray-200 focus:ring-blue-300'
                              }`}
                            />
                          </div>

                          {/* Status + map toggle */}
                          {(eventLocGpsLoading || eventLocGeocoding) && (
                            <p className="mt-1 text-xs text-blue-500 flex items-center gap-1">
                              <span className="w-2.5 h-2.5 border border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
                              {eventLocGeocoding ? 'Looking up address…' : 'Detecting…'}
                            </p>
                          )}
                          {eventLocGeoSuccess && !eventLocGpsLoading && !eventLocGeocoding && (
                            <p className="mt-1 text-xs text-green-600 font-medium">✅ Location detected</p>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowEventLocMap(m => !m)}
                            className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            🗺️ {showEventLocMap ? 'Hide Map' : 'Pick on map'}
                          </button>
                          {showEventLocMap && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-blue-200 shadow-sm">
                              <Suspense fallback={<div style={{height:"260px",display:"flex",alignItems:"center",justifyContent:"center",background:"#fef2f2"}}><div style={{width:28,height:28,border:"4px solid #fecaca",borderTopColor:"#dc2626",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/></div>}>
                              <MapPicker
                                height="220px"
                                center={
                                  eventPickedCoords
                                    ? [eventPickedCoords.lat, eventPickedCoords.lng]
                                    : [27.7172, 85.3240]
                                }
                                zoom={13}
                                pickedLocation={eventPickedCoords}
                                onLocationPick={handleEventLocMapPick}
                                markers={
                                  eventPickedCoords
                                    ? [{
                                        id: 'event-loc',
                                        lat: eventPickedCoords.lat,
                                        lng: eventPickedCoords.lng,
                                        type: 'hospital',
                                        label: eventForm.title || 'Event Location',
                                        subLabel: eventForm.location || '',
                                      }]
                                    : []
                                }
                              />
                              </Suspense>
                              <p className="text-xs text-center text-gray-500 py-1.5 bg-gray-50 border-t border-blue-100">
                                Click to pin the event venue
                              </p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Phone</label>
                          <input
                            type="text"
                            value={eventForm.contactPhone}
                            onChange={e => handleEventFormChange('contactPhone', e.target.value)}
                            placeholder="+977 98XXXXXXXX"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Target Donors</label>
                          <input
                            type="number"
                            min="0"
                            value={eventForm.targetDonors}
                            onChange={e => handleEventFormChange('targetDonors', e.target.value)}
                            placeholder="e.g. 100"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Groups Needed</label>
                          <div className="flex flex-wrap gap-2">
                            {BLOOD_GROUPS_OPTIONS.map(group => (
                              <button
                                key={group}
                                type="button"
                                onClick={() => toggleBloodGroup(group)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                                  eventForm.bloodGroupsNeeded.includes(group)
                                    ? 'bg-blue-600 text-white border-blue-600 shadow'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                }`}
                              >
                                {group}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={eventFormLoading}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition disabled:opacity-60"
                        >
                          {eventFormLoading ? <FaSpinner className="animate-spin" /> : <FaCalendarPlus />}
                          {editingEvent ? 'Update Event' : 'Create & Notify All'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowEventForm(false); setEditingEvent(null); setEventFormResult({ msg: '', type: '' }); }}
                          className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Events List */}
                {eventsLoading ? (
                  <div className="flex justify-center py-12">
                    <FaSpinner className="text-5xl text-blue-600 animate-spin" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-16 text-center">
                    <FaCalendarAlt className="text-8xl text-blue-100 mx-auto mb-6" />
                    <p className="text-2xl font-bold text-gray-700 mb-2">No events yet</p>
                    <p className="text-gray-500">Create your first blood donation drive — all donors and receivers will be notified.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {events.map(ev => {
                      const isPast = new Date(ev.date) < new Date() && ev.status !== 'cancelled';
                      const statusColor = {
                        upcoming: 'bg-blue-100 text-blue-700',
                        ongoing: 'bg-green-100 text-green-700',
                        completed: 'bg-gray-100 text-gray-600',
                        cancelled: 'bg-blue-100 text-blue-600',
                      }[ev.status] || 'bg-gray-100 text-gray-600';

                      return (
                        <div key={ev._id} className={`bg-white rounded-2xl shadow-md border p-6 flex flex-col md:flex-row gap-5 ${ev.status === 'cancelled' ? 'opacity-60 border-gray-200' : 'border-blue-100'}`}>
                          {/* Date badge */}
                          <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-blue-50 rounded-2xl border border-blue-100">
                            <span className="text-xs font-bold text-blue-400 uppercase">{new Date(ev.date).toLocaleString('en', { month: 'short' })}</span>
                            <span className="text-3xl font-extrabold text-blue-600">{new Date(ev.date).getDate()}</span>
                            <span className="text-xs text-gray-500">{new Date(ev.date).getFullYear()}</span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <h4 className="text-lg font-bold text-gray-900 truncate">{ev.title}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColor}`}>{ev.status}</span>
                            </div>
                            {ev.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ev.description}</p>}
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1"><FaClock className="text-blue-400" />{ev.time}</span>
                              <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-blue-400" />{ev.location}</span>
                              {ev.contactPhone && <span className="flex items-center gap-1"><FaPhone className="text-blue-400" />{ev.contactPhone}</span>}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 items-center">
                              {ev.bloodGroupsNeeded?.map(g => (
                                <span key={g} className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold">{g}</span>
                              ))}
                              <button
                                type="button"
                                onClick={() => { setAttendeesEvent(ev); setAttendeesSearch(''); }}
                                className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium ml-2 flex items-center gap-1"
                                title="View attendee details"
                              >
                                <FaUserGroup className="text-xs" />
                                {ev.rsvps?.filter(r => r.status === 'attending').length || 0} attending
                                {ev.targetDonors > 0 && ` / ${ev.targetDonors} target`}
                              </button>
                              {ev.notifiedCount > 0 && (
                                <span className="text-xs text-green-600 flex items-center gap-1 ml-1"><FaEnvelope />{ev.notifiedCount} emailed</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          {ev.status !== 'cancelled' && ev.status !== 'completed' && (
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <button
                                onClick={() => { setAttendeesEvent(ev); setAttendeesSearch(''); }}
                                className="flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 rounded-xl hover:bg-purple-50 transition text-sm font-medium"
                              >
                                <FaUserGroup className="text-purple-500" /> View Attendees
                              </button>
                              <button
                                onClick={() => handleEditEvent(ev)}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                              >
                                <FaEdit className="text-blue-500" /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  setCompletingEvent(ev);
                                  setCompleteForm({
                                    unitsCollected: ev.targetDonors || '',
                                    totalDonors: '',
                                    image: ev.image || '',
                                    story: ev.story || '',
                                    quote: ev.quote || '',
                                    quoteName: ev.quoteName || '',
                                  });
                                  setCompleteImageFile(null);
                                  setCompleteImagePreview('');
                                }}
                                className="flex items-center gap-2 px-4 py-2 border border-green-200 text-green-700 rounded-xl hover:bg-green-50 transition text-sm font-medium"
                              >
                                <FaCheckCircle className="text-green-500" /> Mark Complete
                              </button>
                              <button
                                onClick={() => handleCancelEvent(ev._id)}
                                disabled={cancellingEventId === ev._id}
                                className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition text-sm font-medium disabled:opacity-60"
                              >
                                {cancellingEventId === ev._id ? <FaSpinner className="animate-spin" /> : <FaBan />} Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* ── MARK AS COMPLETED MODAL ─────────────────────────────────────────── */}
            {completingEvent && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <FaCheckCircle className="text-green-500" /> Mark Event as Completed
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-semibold text-gray-700">{completingEvent.title}</span> — fill in the results to showcase this event on the home page.
                    </p>
                  </div>
                  <form onSubmit={handleMarkComplete} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Units Collected</label>
                        <input
                          type="number" min="0"
                          value={completeForm.unitsCollected}
                          onChange={e => setCompleteForm(f => ({ ...f, unitsCollected: e.target.value }))}
                          placeholder="e.g. 250"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Total Donors</label>
                        <input
                          type="number" min="0"
                          value={completeForm.totalDonors}
                          onChange={e => setCompleteForm(f => ({ ...f, totalDonors: e.target.value }))}
                          placeholder="e.g. 100"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Event Cover Photo <span className="text-gray-400 font-normal">(optional, max 5MB)</span>
                      </label>

                      {(completeImagePreview || completeForm.image) ? (
                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 group">
                          <img
                            src={completeImagePreview || completeForm.image}
                            alt="Event cover preview"
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <label className="cursor-pointer px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-xl text-sm font-semibold shadow-md">
                              Change
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleCompleteImageChange}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setCompleteImageFile(null);
                                setCompleteImagePreview('');
                                setCompleteForm(f => ({ ...f, image: '' }));
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md flex items-center gap-1.5"
                            >
                              <FaTrash className="text-xs" /> Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-green-50 hover:border-green-400 transition">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <FaPlusCircle className="text-3xl text-green-500 mb-2" />
                            <p className="text-sm font-semibold">Click to upload photo</p>
                            <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCompleteImageChange}
                          />
                        </label>
                      )}
                      {completeImageFile && (
                        <p className="text-xs text-gray-500 mt-2">
                          Selected: <span className="font-medium text-gray-700">{completeImageFile.name}</span>
                          {' · '}{(completeImageFile.size / 1024).toFixed(0)} KB
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Event Story <span className="text-gray-400 font-normal">(optional)</span></label>
                      <textarea
                        value={completeForm.story}
                        onChange={e => setCompleteForm(f => ({ ...f, story: e.target.value }))}
                        rows={3}
                        placeholder="Describe what happened at this event..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Participant Quote <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input
                        type="text"
                        value={completeForm.quote}
                        onChange={e => setCompleteForm(f => ({ ...f, quote: e.target.value }))}
                        placeholder="e.g. This was an amazing experience..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Quoted Person's Name <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input
                        type="text"
                        value={completeForm.quoteName}
                        onChange={e => setCompleteForm(f => ({ ...f, quoteName: e.target.value }))}
                        placeholder="e.g. Ramesh K., Donor"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={completeFormLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition disabled:opacity-60"
                      >
                        {completeFormLoading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                        Confirm & Publish
                      </button>
                      <button
                        type="button"
                        onClick={closeCompleteModal}
                        className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* ── END EVENTS PANEL ────────────────────────────────────────────────── */}

            {activePanel === 'notifications' && (
              <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-10">
                <h3 className="text-4xl font-bold text-gray-900 mb-8 flex items-center gap-4">
                  <FaBell className="text-blue-600 animate-pulse" />
                  Notifications & Alerts
                </h3>

                {notificationsLoading ? (
                  <div className="flex justify-center py-12">
                    <FaSpinner className="text-5xl text-blue-600 animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-16">
                    <FaBell className="text-8xl text-blue-100 mx-auto mb-6" />
                    <p className="text-2xl text-gray-700">No new notifications</p>
                    <p className="text-lg text-gray-500 mt-3">Low stock or near-expiry alerts will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    {notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`p-6 rounded-2xl border shadow-sm ${
                          notif.severity === 'high' ? 'bg-blue-50 border-blue-300' :
                          notif.severity === 'medium' ? 'bg-orange-50 border-orange-300' :
                          'bg-yellow-50 border-yellow-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg mb-1">
                              {notif.type === 'low_stock' && 'Low Stock Alert'}
                              {notif.type === 'near_expiry' && 'Near Expiry Alert'}
                              {notif.type === 'critical_inventory' && 'Critical Inventory Alert'}
                              {notif.type === 'transfer_request' && 'Transfer Request'}
                              {!['low_stock', 'near_expiry', 'critical_inventory', 'transfer_request'].includes(notif.type) && notif.type}
                            </p>
                            <p className="text-gray-800">{notif.message}</p>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {notif.read ? (
                          <span className="inline-block mt-3 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Read</span>
                        ) : (
                          <span className="inline-block mt-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs animate-pulse">New</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activePanel === 'donors' && (
              <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <FaUsers className="text-blue-600 text-lg" />
                      </span>
                      Donor Network
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 ml-[52px]">All registered donors on the platform</p>
                  </div>
                  <button
                    onClick={() => { setShowAlertForm(v => !v); setAlertResult(''); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
                  >
                    <FaBullhorn className="text-sm" />
                    Send Alert
                  </button>
                </div>

                {/* Alert result banner */}
                {alertResult.msg && (
                  <div className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium border ${
                    alertResult.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}>
                    {alertResult.type === 'success'
                      ? <FaCheckCircle className="text-green-500 flex-shrink-0" />
                      : <FaExclamationCircle className="text-blue-500 flex-shrink-0" />}
                    {alertResult.msg}
                  </div>
                )}

                {/* Send Alert form */}
                {showAlertForm && (() => {
                  // Live preview: count how many donors will be reached
                  const previewDonors = alertGroup
                    ? donors.filter(d => d.bloodGroup === alertGroup && (alertIncludeCooldown || d.isAvailable))
                    : [];
                  const previewAvailable = previewDonors.filter(d => d.isAvailable).length;
                  const previewCooldown = previewDonors.length - previewAvailable;

                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-blue-700 flex items-center gap-2">
                          <FaBullhorn className="text-sm" /> Broadcast Alert to Donors
                        </p>
                        {alertGroup && (
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                            {previewDonors.length === 0
                              ? 'No matching donors'
                              : `Will reach ${previewDonors.length} donor${previewDonors.length !== 1 ? 's' : ''}`}
                            {previewDonors.length > 0 && (
                              <span className="ml-1 text-blue-500 font-normal">
                                ({previewAvailable} available{previewCooldown > 0 ? `, ${previewCooldown} cooldown` : ''})
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Blood group picker */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Blood Group <span className="text-blue-500">*</span>
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => {
                              const bgCount = donors.filter(d => d.bloodGroup === bg && (alertIncludeCooldown || d.isAvailable)).length;
                              return (
                                <button
                                  key={bg}
                                  type="button"
                                  onClick={() => setAlertGroup(bg)}
                                  className={`py-2 rounded-xl text-xs font-bold border-2 transition-all relative ${
                                    alertGroup === bg
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                                  }`}
                                >
                                  {bg}
                                  {bgCount > 0 && (
                                    <span className={`absolute -top-1.5 -right-1.5 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${
                                      alertGroup === bg ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
                                    }`}>{bgCount}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {/* Include cooldown toggle */}
                          <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={alertIncludeCooldown}
                              onChange={e => setAlertIncludeCooldown(e.target.checked)}
                              className="w-4 h-4 accent-blue-600"
                            />
                            <span className="text-xs text-gray-600 font-medium">Also notify donors in cooldown</span>
                          </label>
                        </div>

                        {/* Custom message */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Custom Message <span className="text-gray-400 font-normal">(optional)</span>
                          </label>
                          <textarea
                            value={alertMessage}
                            onChange={e => setAlertMessage(e.target.value)}
                            rows="4"
                            placeholder={alertGroup
                              ? `Default: "🏥 ${user?.hospitalName || user?.username} needs ${alertGroup} blood donors. You're eligible — please visit or contact us!"`
                              : 'Select a blood group first...'}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 outline-none text-sm resize-none"
                          />
                          <p className="text-xs text-gray-400 mt-1">Leave blank to use the personalised default message.</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setShowAlertForm(false); setAlertGroup(''); setAlertMessage(''); setAlertIncludeCooldown(false); }}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSendAlert}
                          disabled={!alertGroup || alertLoading || previewDonors.length === 0}
                          className={`flex-[2] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                            !alertGroup || alertLoading || previewDonors.length === 0
                              ? 'bg-blue-300 cursor-not-allowed text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                          }`}
                        >
                          {alertLoading
                            ? <><FaSpinner className="animate-spin text-xs" /> Sending...</>
                            : previewDonors.length === 0 && alertGroup
                            ? 'No donors to notify'
                            : <><FaBullhorn className="text-xs" /> Send Alert to {previewDonors.length} {alertGroup || '?'} Donor{previewDonors.length !== 1 ? 's' : ''}</>}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Donors', value: donorStats.total, color: 'text-gray-800', bg: 'border-gray-100', icon: FaUsers },
                    { label: 'Available Now', value: donorStats.available, color: 'text-green-600', bg: 'border-green-100', icon: FaHeart },
                    { label: 'In Cooldown', value: donorStats.cooldown, color: 'text-orange-500', bg: 'border-orange-100', icon: FaLock },
                    {
                      label: 'Most Common',
                      value: Object.entries(donorStats.byBloodGroup).sort((a,b) => b[1]-a[1])[0]?.[0] || '—',
                      color: 'text-blue-600',
                      bg: 'border-blue-100',
                      icon: FaTint,
                    },
                  ].map(stat => (
                    <div key={stat.label} className={`bg-white p-5 rounded-2xl shadow-sm border ${stat.bg} flex flex-col gap-1`}>
                      <div className="flex items-center gap-2 mb-1">
                        <stat.icon className={`text-base ${stat.color} opacity-60`} />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                      </div>
                      <div className={`text-3xl font-extrabold ${stat.color}`}>{donorsLoading ? '...' : stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[160px]">
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Search</label>
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                        <input
                          type="text"
                          value={donorFilter.search}
                          onChange={e => setDonorFilter(p => ({ ...p, search: e.target.value }))}
                          placeholder="Name or location..."
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Blood Group</label>
                      <select
                        value={donorFilter.bloodGroup}
                        onChange={e => setDonorFilter(p => ({ ...p, bloodGroup: e.target.value }))}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 outline-none bg-white"
                      >
                        <option value="">All Groups</option>
                        {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Availability</label>
                      <select
                        value={donorFilter.available}
                        onChange={e => setDonorFilter(p => ({ ...p, available: e.target.value }))}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 outline-none bg-white"
                      >
                        <option value="">All</option>
                        <option value="true">Available</option>
                        <option value="false">In Cooldown</option>
                      </select>
                    </div>
                    <button
                      onClick={() => fetchDonors(donorFilter)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold rounded-xl transition-all"
                    >
                      <FaFilter className="text-xs" /> Filter
                    </button>
                    <button
                      onClick={() => {
                        const reset = { bloodGroup: '', available: '', search: '' };
                        setDonorFilter(reset);
                        fetchDonors(reset);
                      }}
                      className="px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl transition-all"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Donor list */}
                {donorsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <FaSpinner className="animate-spin text-3xl text-blue-400" />
                  </div>
                ) : donors.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <FaUsers className="text-4xl text-gray-200 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-600">No donors found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {donors.map(donor => {
                      const available = donor.isAvailable;
                      return (
                        <div
                          key={donor._id}
                          className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all ${
                            available ? 'border-green-100' : 'border-orange-100'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Avatar circle */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-lg text-white shadow-sm ${
                              available ? 'bg-green-500' : 'bg-orange-400'
                            }`}>
                              {donor.username?.charAt(0)?.toUpperCase() || '?'}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-bold text-gray-900 text-base">{donor.username}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-extrabold bg-blue-600 text-white px-2.5 py-1 rounded-lg">
                                    {donor.bloodGroup}
                                  </span>
                                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                    available
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {available ? '● Available' : '⏸ Cooldown'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                {donor.location && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <FaMapMarkerAlt className="text-gray-400 text-xs" />
                                    {donor.location}
                                  </span>
                                )}
                                {donor.phone && (
                                  <a
                                    href={`tel:${donor.phone}`}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                                  >
                                    <FaPhone className="text-xs" />
                                    {donor.phone}
                                  </a>
                                )}
                              </div>

                              {!available && donor.daysLeft > 0 && (
                                <p className="text-xs text-orange-600 mt-1.5 flex items-center gap-1">
                                  <FaLock className="text-xs" />
                                  Eligible again in <strong className="ml-0.5">{donor.daysLeft} day{donor.daysLeft !== 1 ? 's' : ''}</strong>
                                  {donor.nextEligible && (
                                    <span className="text-gray-400 ml-1">
                                      ({new Date(donor.nextEligible).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activePanel === 'requests' && (
              <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <FaClipboardList className="text-blue-600 text-lg" />
                      </span>
                      Blood Requests
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 ml-[52px]">All blood requests on the platform</p>
                  </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: 'Total Requests', value: requestStats.total, color: 'text-gray-800', border: 'border-gray-100', icon: FaClipboardList },
                    { label: 'Emergency', value: requestStats.emergency, color: 'text-red-600', border: 'border-red-100', icon: FaExclamationTriangle },
                    { label: 'Pending', value: requestStats.pending, color: 'text-yellow-600', border: 'border-yellow-100', icon: FaSpinner },
                    { label: 'Donor Assigned', value: requestStats.accepted, color: 'text-blue-600', border: 'border-blue-100', icon: FaHandHoldingHeart },
                    { label: 'Fulfilled Today', value: requestStats.fulfilledToday, color: 'text-green-600', border: 'border-green-100', icon: FaCheckCircle },
                  ].map(s => (
                    <div key={s.label} className={`bg-white p-5 rounded-2xl shadow-sm border ${s.border} flex flex-col gap-1`}>
                      <div className="flex items-center gap-2 mb-1">
                        <s.icon className={`text-base ${s.color} opacity-60`} />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
                      </div>
                      <div className={`text-3xl font-extrabold ${s.color}`}>{requestsLoading ? '…' : s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Tabs + Map toggle */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
                    {[
                      { key: 'all',  label: 'All Requests' },
                      { key: 'mine', label: 'At This Hospital' },
                      { key: 'post', label: '+ Post Request' },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setRequestTab(tab.key)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                          requestTab === tab.key
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >{tab.label}</button>
                    ))}
                  </div>
                  {/* Map view toggle */}
                  <button
                    onClick={() => setShowRequestsMap(v => !v)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      showRequestsMap
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    🗺️ {showRequestsMap ? 'Hide Map' : 'Map View'}
                  </button>
                </div>

                {/* ── Blood Requests Map ──────────────────────────────────── */}
                {showRequestsMap && (
                  <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">
                        Live Blood Requests Map
                        {allRequests.some(r => r.urgency === 'emergency' && r.status === 'pending') && (
                          <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full animate-pulse">EMERGENCY</span>
                        )}
                      </p>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block animate-pulse" /> Emergency</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Normal</span>
                      </div>
                    </div>
                    <Suspense fallback={<div style={{height:"260px",display:"flex",alignItems:"center",justifyContent:"center",background:"#fef2f2"}}><div style={{width:28,height:28,border:"4px solid #fecaca",borderTopColor:"#dc2626",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/></div>}>
                    <MapPicker
                      height="420px"
                      center={[27.7172, 85.3240]}
                      zoom={11}
                      fitMarkers={allRequests.filter(r => r.coordinates?.lat).length > 0}
                      markers={allRequests
                        .filter(r => r.status === 'pending' && r.coordinates?.lat)
                        .map(r => ({
                          id:          r._id,
                          lat:         r.coordinates.lat,
                          lng:         r.coordinates.lng,
                          bloodGroup:  r.bloodGroup,
                          label:       r.hospital || r.location,
                          subLabel:    `${r.bloodGroup} · ${r.units} unit${r.units > 1 ? 's' : ''}`,
                          units:       r.units,
                          phone:       r.contactPhone,
                          isEmergency: r.urgency === 'emergency',
                          type:        'hospital',
                        }))}
                      readOnly
                    />
                    </Suspense>
                    {allRequests.filter(r => r.status === 'pending' && r.coordinates?.lat).length === 0 && (
                      <div className="px-4 py-3 bg-gray-50 text-xs text-gray-400 text-center border-t border-gray-100">
                        No pending requests with location data yet. Requests submitted via the app will appear here.
                      </div>
                    )}
                  </div>
                )}

                {/* Post Request Form */}
                {requestTab === 'post' && (
                  <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 max-w-xl space-y-5">
                    <p className="text-sm font-bold text-gray-800">Post a Blood Request on Behalf of a Patient</p>
                    <p className="text-xs text-gray-500 -mt-3">Hospital name is pre-filled automatically.</p>

                    {postResult.msg && (
                      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                        postResult.type === 'success'
                          ? 'bg-green-50 border border-green-200 text-green-700'
                          : 'bg-blue-50 border border-blue-200 text-blue-700'
                      }`}>
                        {postResult.type === 'success'
                          ? <FaCheckCircle className="flex-shrink-0" />
                          : <FaExclamationCircle className="flex-shrink-0" />}
                        {postResult.msg}
                      </div>
                    )}

                    <form onSubmit={handlePostRequest} className="space-y-4">
                      {/* Urgency */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Urgency</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'normal', label: '🩸 Normal', desc: 'Within a few days' },
                            { value: 'emergency', label: '🚨 Emergency', desc: 'Urgent, within hours' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setPostForm(p => ({ ...p, urgency: opt.value }))}
                              className={`flex flex-col items-start px-4 py-3 rounded-xl border-2 text-left transition-all ${
                                postForm.urgency === opt.value
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 text-gray-600 hover:border-blue-200'
                              }`}
                            >
                              <span className="text-sm font-bold">{opt.label}</span>
                              <span className="text-xs opacity-70">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Blood group */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Blood Group <span className="text-blue-500">*</span></label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => (
                            <button
                              key={bg}
                              type="button"
                              onClick={() => setPostForm(p => ({ ...p, bloodGroup: bg }))}
                              className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                                postForm.bloodGroup === bg
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                              }`}
                            >{bg}</button>
                          ))}
                        </div>
                      </div>

                      {/* Units */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Units Needed <span className="text-blue-500">*</span></label>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => setPostForm(p => ({ ...p, units: Math.max(1, p.units - 1) }))}
                            className="w-10 h-10 rounded-xl border-2 border-gray-200 text-lg font-bold text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all">−</button>
                          <span className="text-2xl font-extrabold text-blue-600 w-8 text-center">{postForm.units}</span>
                          <button type="button" onClick={() => setPostForm(p => ({ ...p, units: Math.min(10, p.units + 1) }))}
                            className="w-10 h-10 rounded-xl border-2 border-gray-200 text-lg font-bold text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all">+</button>
                          <span className="text-xs text-gray-400 ml-1">~{postForm.units * 350}ml</span>
                        </div>
                      </div>

                      {/* Location + Phone */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Location / Ward
                            <span className="ml-1 text-blue-400 font-normal">(click 📍)</span>
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => detectAndFill(setPostLocGpsLoading, (v) => setPostForm(p => ({ ...p, location: v })), setPostLocGeoSuccess, setPostLocGeocoding, setPostPickedCoords)}
                              disabled={postLocGpsLoading || postLocGeocoding}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 group disabled:cursor-not-allowed"
                              title="Detect live location"
                            >
                              {postLocGpsLoading || postLocGeocoding
                                ? <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
                                : postLocGeoSuccess
                                  ? <span className="text-green-500 text-xs">📍</span>
                                  : <span className="text-gray-400 group-hover:text-blue-500 group-hover:scale-125 transition-all text-xs">📍</span>
                              }
                            </button>
                            <input
                              type="text"
                              value={postForm.location}
                              onChange={e => { setPostForm(p => ({ ...p, location: e.target.value })); setPostLocGeoSuccess(false); }}
                              placeholder="Click 📍 or type…"
                              className={`w-full pl-7 pr-2 py-2.5 rounded-xl border text-sm focus:outline-none ${
                                postLocGeoSuccess ? 'border-green-400' : 'border-gray-200 focus:border-blue-400'
                              }`}
                            />
                          </div>

                          {/* Map toggle for post location */}
                          <button
                            type="button"
                            onClick={() => setShowPostLocMap(m => !m)}
                            className="mt-1 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            🗺️ {showPostLocMap ? 'Hide' : 'Pick on map'}
                          </button>
                          {showPostLocMap && (
                            <div className="mt-1.5 rounded-xl overflow-hidden border border-blue-200 shadow-sm col-span-2">
                              <Suspense fallback={<div style={{height:"260px",display:"flex",alignItems:"center",justifyContent:"center",background:"#fef2f2"}}><div style={{width:28,height:28,border:"4px solid #fecaca",borderTopColor:"#dc2626",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/></div>}>
                              <MapPicker
                                height="200px"
                                center={
                                  postPickedCoords
                                    ? [postPickedCoords.lat, postPickedCoords.lng]
                                    : [27.7172, 85.3240]
                                }
                                zoom={13}
                                pickedLocation={postPickedCoords}
                                onLocationPick={handlePostLocMapPick}
                                markers={
                                  postPickedCoords
                                    ? [{
                                        id: 'post-loc',
                                        lat: postPickedCoords.lat,
                                        lng: postPickedCoords.lng,
                                        type: 'hospital',
                                        label: hospitalName || 'Hospital',
                                        subLabel: postForm.location || '',
                                      }]
                                    : []
                                }
                              />
                              </Suspense>
                              <p className="text-xs text-center text-gray-500 py-1 bg-gray-50 border-t border-blue-100">
                                Click to pin exact location
                              </p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contact Phone <span className="text-blue-500">*</span></label>
                          <input
                            type="tel"
                            required
                            value={postForm.contactPhone}
                            onChange={e => setPostForm(p => ({ ...p, contactPhone: e.target.value }))}
                            placeholder="e.g. 9841234567"
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 outline-none"
                          />
                        </div>
                      </div>

                      {/* Note */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Note <span className="text-gray-400 font-normal">(optional)</span></label>
                        <textarea
                          value={postForm.note}
                          onChange={e => setPostForm(p => ({ ...p, note: e.target.value }))}
                          rows="2"
                          placeholder="Patient details, special requirements..."
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 outline-none resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={postLoading || !postForm.bloodGroup}
                        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                          postLoading || !postForm.bloodGroup
                            ? 'bg-blue-300 cursor-not-allowed text-white'
                            : postForm.urgency === 'emergency'
                            ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-sm'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        }`}
                      >
                        {postLoading
                          ? <><FaSpinner className="animate-spin text-xs" /> Posting...</>
                          : postForm.urgency === 'emergency'
                          ? '🚨 Post Emergency Request'
                          : '🩸 Post Blood Request'}
                      </button>
                    </form>
                  </div>
                )}

                {/* All / At This Hospital list */}
                {(requestTab === 'all' || requestTab === 'mine') && (
                  <>
                    {/* Filter bar */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[150px]">
                          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Search</label>
                          <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                            <input
                              type="text"
                              value={requestFilter.search}
                              onChange={e => setRequestFilter(p => ({ ...p, search: e.target.value }))}
                              placeholder="Hospital or location..."
                              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Blood Group</label>
                          <select
                            value={requestFilter.bloodGroup}
                            onChange={e => setRequestFilter(p => ({ ...p, bloodGroup: e.target.value }))}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 outline-none bg-white"
                          >
                            <option value="">All Groups</option>
                            {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => (
                              <option key={bg} value={bg}>{bg}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Urgency</label>
                          <select
                            value={requestFilter.urgency}
                            onChange={e => setRequestFilter(p => ({ ...p, urgency: e.target.value }))}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 outline-none bg-white"
                          >
                            <option value="">All</option>
                            <option value="emergency">🚨 Emergency</option>
                            <option value="normal">Normal</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
                          <select
                            value={requestFilter.status}
                            onChange={e => setRequestFilter(p => ({ ...p, status: e.target.value }))}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 outline-none bg-white"
                          >
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="fulfilled">Fulfilled</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <button
                          onClick={() => fetchAllRequests(requestFilter)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold rounded-xl transition-all"
                        >
                          <FaFilter className="text-xs" /> Filter
                        </button>
                        <button
                          onClick={() => {
                            const reset = { bloodGroup: '', urgency: '', status: '', search: '' };
                            setRequestFilter(reset);
                            fetchAllRequests(reset);
                          }}
                          className="px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl transition-all"
                        >Reset</button>
                      </div>
                    </div>

                    {/* Request cards */}
                    {requestsLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <FaSpinner className="animate-spin text-3xl text-blue-400" />
                      </div>
                    ) : (() => {
                      const hospitalName = (user?.hospitalName || user?.username || '').toLowerCase();
                      const displayed = requestTab === 'mine'
                        ? allRequests.filter(r => r.hospital?.toLowerCase().includes(hospitalName))
                        : allRequests;

                      return displayed.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                          <FaClipboardList className="text-4xl text-gray-200 mx-auto mb-4" />
                          <p className="text-lg font-semibold text-gray-600">No requests found</p>
                          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-500 font-medium">{displayed.length} request{displayed.length !== 1 ? 's' : ''}</p>
                          {displayed.map(req => {
                            const isEmerg = req.urgency === 'emergency';
                            const isPending = req.status === 'pending';
                            const isAccepted = req.status === 'accepted';
                            const isFulfilled = req.status === 'fulfilled' || req.status === 'Fulfilled';
                            const isCancelled = req.status === 'cancelled';

                            return (
                              <div
                                key={req._id}
                                className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${
                                  isEmerg && isPending ? 'border-blue-300' : 'border-gray-100'
                                }`}
                              >
                                {isEmerg && (
                                  <div className="bg-blue-600 px-4 py-1.5 flex items-center gap-2">
                                    <span className="text-sm animate-pulse">🚨</span>
                                    <span className="text-xs font-bold text-white uppercase tracking-wide">Emergency Request</span>
                                  </div>
                                )}
                                <div className="p-4">
                                  <div className="flex items-start gap-4">
                                    {/* Blood group badge */}
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isEmerg ? 'bg-blue-600' : 'bg-blue-500'}`}>
                                      <span className="text-white font-extrabold text-sm">{req.bloodGroup}</span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <div>
                                          <p className="font-bold text-gray-900">{req.hospital}</p>
                                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                              <FaTint className="text-blue-400 text-xs" />{req.units} unit{req.units > 1 ? 's' : ''}
                                            </span>
                                            {req.location && (
                                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <FaMapMarkerAlt className="text-gray-400 text-xs" />{req.location}
                                              </span>
                                            )}
                                            <span className="text-xs text-gray-400">{timeAgo(req.createdAt)}</span>
                                          </div>
                                        </div>
                                        {/* Status pill */}
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full border flex-shrink-0 ${
                                          isFulfilled ? 'bg-green-50 text-green-700 border-green-200'
                                          : isAccepted ? 'bg-blue-50 text-blue-700 border-blue-200'
                                          : isPending ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                          : isCancelled ? 'bg-gray-50 text-gray-500 border-gray-200'
                                          : 'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}>
                                          {isFulfilled ? '✓ Fulfilled' : isAccepted ? '● Accepted' : isPending ? '○ Pending' : '✕ Cancelled'}
                                        </span>
                                      </div>

                                      {/* Contact + donor info */}
                                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                                        {req.requester?.username && (
                                          <span className="text-xs text-gray-500">
                                            By: <span className="font-semibold text-gray-700">{req.requester.username}</span>
                                          </span>
                                        )}
                                        {req.contactPhone && (
                                          <a href={`tel:${req.contactPhone}`} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                            <FaPhone className="text-xs" />{req.contactPhone}
                                          </a>
                                        )}
                                        {isAccepted && req.acceptedBy?.username && (
                                          <span className="text-xs text-blue-600 font-semibold">
                                            Donor: {req.acceptedBy.username}
                                            {req.acceptedBy.phone && ` · ${req.acceptedBy.phone}`}
                                          </span>
                                        )}
                                      </div>

                                      {req.note && (
                                        <p className="text-xs text-gray-400 italic mt-1 truncate max-w-md">{req.note}</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action buttons — for own requests on any tab */}
                                  {(requestTab === 'mine' || requestTab === 'all') && (
                                    (() => {
                                      const userId = user?._id || user?.id;
                                      const isOwner = userId && req.requester?._id &&
                                        String(req.requester._id) === String(userId);
                                      if (!isOwner) return null;
                                      const busy = actionLoading === req._id;
                                      return (
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 flex-wrap">
                                          {isPending && (
                                            <>
                                              <button
                                                onClick={() => openEditModal(req)}
                                                disabled={busy}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-all disabled:opacity-50"
                                              >
                                                <FaEdit className="text-xs" /> Edit
                                              </button>
                                              <button
                                                onClick={() => openAssignModal(req)}
                                                disabled={busy}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-50 transition-all disabled:opacity-50"
                                              >
                                                <FaUsers className="text-xs" /> Assign Donor
                                              </button>
                                              <button
                                                onClick={() => handleCancelRequest(req._id)}
                                                disabled={busy}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50"
                                              >
                                                {busy
                                                  ? <FaSpinner className="animate-spin text-xs" />
                                                  : <FaBan className="text-xs" />}
                                                Cancel Request
                                              </button>
                                            </>
                                          )}
                                          {isAccepted && (
                                            <button
                                              onClick={() => handleFulfillRequest(req._id)}
                                              disabled={busy}
                                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-green-700 border border-green-300 rounded-xl hover:bg-green-50 transition-all disabled:opacity-50"
                                            >
                                              {busy
                                                ? <FaSpinner className="animate-spin text-xs" />
                                                : <FaCheckCircle className="text-xs" />}
                                              Mark as Fulfilled
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })()
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Assign Donor Modal ── */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaUsers className="text-purple-500" /> Assign a Donor
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Assigning will confirm the donation and start their 56-day cooldown.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold bg-blue-600 text-white px-2.5 py-1 rounded-lg">
                    {assignModal.bloodGroup}
                  </span>
                  <span className="text-xs text-gray-500">· {assignModal.units} unit{assignModal.units > 1 ? 's' : ''} needed</span>
                  <span className="text-xs text-gray-500">· {assignModal.hospital}</span>
                </div>
              </div>
              <button
                onClick={() => setAssignModal(null)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-all mt-1"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Result banner */}
            {assignResult.msg && (
              <div className={`mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                assignResult.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-blue-50 border border-blue-200 text-blue-700'
              }`}>
                {assignResult.type === 'success'
                  ? <FaCheckCircle className="flex-shrink-0" />
                  : <FaExclamationCircle className="flex-shrink-0" />}
                {assignResult.msg}
              </div>
            )}

            {/* Search */}
            <div className="px-6 pt-4 pb-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={assignSearch}
                  onChange={e => setAssignSearch(e.target.value)}
                  placeholder="Search by name, phone or location..."
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-purple-400 outline-none"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Showing available <strong>{assignModal.bloodGroup}</strong> donors only
              </p>
            </div>

            {/* Donor list */}
            <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-2">
              {assignDonorsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <FaSpinner className="animate-spin text-2xl text-purple-400" />
                </div>
              ) : (() => {
                const q = assignSearch.toLowerCase();
                const filtered = assignDonors.filter(d =>
                  !q ||
                  d.username?.toLowerCase().includes(q) ||
                  d.phone?.toLowerCase().includes(q) ||
                  d.location?.toLowerCase().includes(q)
                );

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <FaUsers className="text-3xl text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-500">No eligible donors found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Try searching by name, or send a broadcast alert from the Donor Network tab
                      </p>
                    </div>
                  );
                }

                return filtered.map(donor => (
                  <div
                    key={donor._id}
                    className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:border-purple-200 hover:bg-purple-50 transition-all group"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-extrabold text-white text-sm flex-shrink-0">
                      {donor.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{donor.username}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        {donor.phone && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FaPhone className="text-gray-400 text-xs" />{donor.phone}
                          </span>
                        )}
                        {donor.location && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FaMapMarkerAlt className="text-gray-400 text-xs" />{donor.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAssignDonor(donor._id)}
                      disabled={assignLoading}
                      className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all disabled:opacity-50 shadow-sm"
                    >
                      {assignLoading
                        ? <FaSpinner className="animate-spin text-xs" />
                        : <FaCheckCircle className="text-xs" />}
                      Assign
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Request Modal ── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-all"
            >
              <FaTimes className="text-xl" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaEdit className="text-blue-500" /> Edit Blood Request
              </h3>
              <p className="text-xs text-gray-500 mt-1">Only pending requests can be edited.</p>
            </div>

            {editResult.msg && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                editResult.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-blue-50 border border-blue-200 text-blue-700'
              }`}>
                {editResult.type === 'success' ? <FaCheckCircle className="flex-shrink-0" /> : <FaExclamationCircle className="flex-shrink-0" />}
                {editResult.msg}
              </div>
            )}

            {/* Urgency */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Urgency</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'normal', label: '🩸 Normal', desc: 'Within a few days' },
                  { value: 'emergency', label: '🚨 Emergency', desc: 'Urgent, within hours' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEditForm(p => ({ ...p, urgency: opt.value }))}
                    className={`flex flex-col items-start px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      editForm.urgency === opt.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-blue-200'
                    }`}
                  >
                    <span className="text-sm font-bold">{opt.label}</span>
                    <span className="text-xs opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Blood Group</label>
              <div className="grid grid-cols-4 gap-1.5">
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setEditForm(p => ({ ...p, bloodGroup: bg }))}
                    className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      editForm.bloodGroup === bg
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >{bg}</button>
                ))}
              </div>
            </div>

            {/* Units */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Units Needed</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setEditForm(p => ({ ...p, units: Math.max(1, p.units - 1) }))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 text-lg font-bold text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all">−</button>
                <span className="text-2xl font-extrabold text-blue-600 w-8 text-center">{editForm.units}</span>
                <button type="button" onClick={() => setEditForm(p => ({ ...p, units: Math.min(10, p.units + 1) }))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 text-lg font-bold text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all">+</button>
                <span className="text-xs text-gray-400 ml-1">~{editForm.units * 350}ml</span>
              </div>
            </div>

            {/* Location + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Location / Ward</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Ward 3, Kathmandu"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contact Phone</label>
                <input
                  type="tel"
                  value={editForm.contactPhone}
                  onChange={e => setEditForm(p => ({ ...p, contactPhone: e.target.value }))}
                  placeholder="e.g. 9841234567"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 outline-none"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Note <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={editForm.note}
                onChange={e => setEditForm(p => ({ ...p, note: e.target.value }))}
                rows="2"
                placeholder="Patient details, special requirements..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
              >Discard</button>
              <button
                onClick={handleSaveEdit}
                disabled={editLoading || !editForm.bloodGroup}
                className={`flex-[2] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  editLoading || !editForm.bloodGroup
                    ? 'bg-blue-300 cursor-not-allowed text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                }`}
              >
                {editLoading
                  ? <><FaSpinner className="animate-spin text-xs" /> Saving...</>
                  : <><FaCheckCircle className="text-xs" /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Unit (set expiry date) Modal */}
      {addUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 relative">
            <button
              onClick={() => {
                if (addUnitLoading) return;
                setAddUnitModal(null);
                setAddUnitExpiryDate('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-all"
            >
              <FaTimes className="text-xl" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaTint className="text-blue-500" /> Add 1 Unit of {addUnitModal.bloodGroup}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Please set the expiry date for the blood unit being added to inventory.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Expiry Date <span className="text-blue-500">*</span>
              </label>
              <input
                type="date"
                value={addUnitExpiryDate}
                onChange={(e) => setAddUnitExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none"
              />
              <p className="text-xs text-gray-400 mt-2">
                Whole blood typically expires 35–42 days from collection.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  if (addUnitLoading) return;
                  setAddUnitModal(null);
                  setAddUnitExpiryDate('');
                }}
                disabled={addUnitLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddUnit}
                disabled={addUnitLoading || !addUnitExpiryDate}
                className={`flex-[2] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  addUnitLoading || !addUnitExpiryDate
                    ? 'bg-green-300 cursor-not-allowed text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                }`}
              >
                {addUnitLoading
                  ? <><FaSpinner className="animate-spin text-xs" /> Adding...</>
                  : <><FaPlusCircle className="text-xs" /> Add 1 Unit</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal (replaces window.confirm) */}
      {confirmModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 space-y-5 relative">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                confirmModal.tone === 'danger' ? 'bg-blue-100 text-blue-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {confirmModal.tone === 'danger'
                  ? <FaExclamationTriangle className="text-xl" />
                  : <FaInfoCircle className="text-xl" />}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-lg font-bold text-gray-900">{confirmModal.title}</h3>
                {confirmModal.message && (
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{confirmModal.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={confirmModal.onCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
              >
                {confirmModal.cancelText}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`flex-[2] py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all ${
                  confirmModal.tone === 'danger'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Attendees Modal */}
      {attendeesEvent && (() => {
        const allRsvps = (attendeesEvent.rsvps || []).filter(r => r.status === 'attending');
        const q = attendeesSearch.trim().toLowerCase();
        const filtered = q
          ? allRsvps.filter(r => {
              const u = r.user || {};
              return (
                (u.username || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.phone || '').toLowerCase().includes(q) ||
                (u.bloodGroup || '').toLowerCase().includes(q) ||
                (u.location || '').toLowerCase().includes(q)
              );
            })
          : allRsvps;

        return (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col relative">
              <button
                onClick={() => setAttendeesEvent(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-all z-10"
              >
                <FaTimes className="text-xl" />
              </button>

              {/* Header */}
              <div className="px-7 pt-7 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaUserGroup className="text-blue-500" />
                  Attendees — {attendeesEvent.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(attendeesEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  {' · '}{attendeesEvent.time}
                  {' · '}{attendeesEvent.location}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold">
                    {allRsvps.length} confirmed
                  </span>
                  {attendeesEvent.targetDonors > 0 && (
                    <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold">
                      Target: {attendeesEvent.targetDonors}
                    </span>
                  )}
                </div>

                {/* Search */}
                {allRsvps.length > 0 && (
                  <div className="mt-4 relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      value={attendeesSearch}
                      onChange={e => setAttendeesSearch(e.target.value)}
                      placeholder="Search by name, phone, email, blood group, or location..."
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-7 py-4">
                {allRsvps.length === 0 ? (
                  <div className="text-center py-16">
                    <FaUserGroup className="text-5xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No attendees yet</p>
                    <p className="text-xs text-gray-400 mt-1">Donors who RSVP will appear here.</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <FaSearch className="text-3xl text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No attendees match "{attendeesSearch}"</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((r, idx) => {
                      // r.user can be a populated user object OR a raw ObjectId string
                      // (raw string happens when backend populate hasn't run yet — needs server restart)
                      const isPopulated = r.user && typeof r.user === 'object';
                      const u = isPopulated ? r.user : {};
                      const displayName = u.username || 'Details unavailable — restart backend';
                      const initials = u.username
                        ? u.username.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
                        : '?';
                      return (
                        <div
                          key={(u._id || idx) + ''}
                          className="flex items-start gap-4 p-4 rounded-2xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                        >
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
                            {u.avatar
                              ? <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                              : initials}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`font-bold text-base ${isPopulated && u.username ? 'text-gray-900' : 'text-orange-600'}`}>
                                {displayName}
                              </h4>
                              {u.bloodGroup && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">
                                  {u.bloodGroup}
                                </span>
                              )}
                              {u.role && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-semibold uppercase">
                                  {u.role}
                                </span>
                              )}
                            </div>

                            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                              {u.phone ? (
                                <a href={`tel:${u.phone}`} className="flex items-center gap-1.5 hover:text-blue-600 transition font-medium">
                                  <FaPhone className="text-blue-400 text-xs" /> {u.phone}
                                </a>
                              ) : isPopulated && (
                                <span className="flex items-center gap-1.5 text-gray-400 italic">
                                  <FaPhone className="text-gray-300 text-xs" /> No phone provided
                                </span>
                              )}
                              {u.email && (
                                <a href={`mailto:${u.email}`} className="flex items-center gap-1.5 hover:text-blue-600 transition truncate">
                                  <FaEnvelope className="text-blue-400 text-xs" /> {u.email}
                                </a>
                              )}
                              {u.location && (
                                <span className="flex items-center gap-1.5">
                                  <FaMapMarkerAlt className="text-blue-400 text-xs" /> {u.location}
                                </span>
                              )}
                            </div>

                            {!isPopulated && (
                              <p className="text-[11px] text-orange-600 mt-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1 inline-block">
                                Restart your backend server so attendee details can be loaded.
                              </p>
                            )}

                            {r.rsvpAt && (
                              <p className="text-[11px] text-gray-400 mt-1.5">
                                RSVP'd {new Date(r.rsvpAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-7 py-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setAttendeesEvent(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast notifications */}
      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}

export default HospitalDashboard; 