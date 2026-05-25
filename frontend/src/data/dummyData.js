/**
 * Dummy Data for BloodBridge Application
 * This file contains mock data for donors, blood requests, and inventory
 */

// Dummy donors data — with Nepal coordinates for map display
export const dummyDonors = [
  {
    id: 1,
    name: 'Aarav Sharma',
    email: 'aarav@example.com',
    bloodGroup: 'O+',
    phone: '9841234501',
    location: 'Thamel, Kathmandu',
    lat: 27.7151, lng: 85.3123,
    lastDonation: '2024-01-15',
    available: true
  },
  {
    id: 2,
    name: 'Sita Karki',
    email: 'sita@example.com',
    bloodGroup: 'A+',
    phone: '9841234502',
    location: 'Lalitpur, Patan',
    lat: 27.6588, lng: 85.3247,
    lastDonation: '2024-02-10',
    available: true
  },
  {
    id: 3,
    name: 'Bikash Thapa',
    email: 'bikash@example.com',
    bloodGroup: 'B+',
    phone: '9841234503',
    location: 'Baneshwor, Kathmandu',
    lat: 27.6921, lng: 85.3428,
    lastDonation: '2024-01-20',
    available: true
  },
  {
    id: 4,
    name: 'Priya Rana',
    email: 'priya@example.com',
    bloodGroup: 'AB+',
    phone: '9841234504',
    location: 'Koteshwor, Kathmandu',
    lat: 27.6839, lng: 85.3564,
    lastDonation: '2024-02-05',
    available: true
  },
  {
    id: 5,
    name: 'Rohan Bista',
    email: 'rohan@example.com',
    bloodGroup: 'O-',
    phone: '9841234505',
    location: 'Maharajgunj, Kathmandu',
    lat: 27.7356, lng: 85.3307,
    lastDonation: '2024-01-25',
    available: true
  },
  {
    id: 6,
    name: 'Anita Gurung',
    email: 'anita@example.com',
    bloodGroup: 'A-',
    phone: '9841234506',
    location: 'Chabahil, Kathmandu',
    lat: 27.7221, lng: 85.3490,
    lastDonation: '2024-02-12',
    available: true
  },
  {
    id: 7,
    name: 'Suresh Adhikari',
    email: 'suresh@example.com',
    bloodGroup: 'B-',
    phone: '9841234507',
    location: 'Kirtipur, Kathmandu',
    lat: 27.6773, lng: 85.2791,
    lastDonation: '2024-02-01',
    available: true
  },
  {
    id: 8,
    name: 'Deepa Pandey',
    email: 'deepa@example.com',
    bloodGroup: 'AB-',
    phone: '9841234508',
    location: 'Bhaktapur',
    lat: 27.6710, lng: 85.4298,
    lastDonation: '2024-01-30',
    available: true
  },
]

// Dummy blood requests
export const dummyBloodRequests = [
  {
    id: 1,
    requesterName: 'Alice Johnson',
    bloodGroup: 'O+',
    units: 2,
    urgency: 'High',
    location: 'New York, NY',
    hospital: 'City Hospital',
    status: 'Pending',
    date: '2024-02-15',
    contact: '+1234567800'
  },
  {
    id: 2,
    requesterName: 'Bob Miller',
    bloodGroup: 'A+',
    units: 1,
    urgency: 'Medium',
    location: 'Los Angeles, CA',
    hospital: 'General Hospital',
    status: 'Fulfilled',
    date: '2024-02-14',
    contact: '+1234567801'
  },
  {
    id: 3,
    requesterName: 'Carol White',
    bloodGroup: 'B+',
    units: 3,
    urgency: 'High',
    location: 'Chicago, IL',
    hospital: 'Memorial Hospital',
    status: 'Pending',
    date: '2024-02-16',
    contact: '+1234567802'
  }
]

// Dummy hospital inventory
export const dummyInventory = [
  { bloodGroup: 'O+', units: 45, status: 'Available' },
  { bloodGroup: 'O-', units: 12, status: 'Available' },
  { bloodGroup: 'A+', units: 38, status: 'Available' },
  { bloodGroup: 'A-', units: 8, status: 'Low' },
  { bloodGroup: 'B+', units: 25, status: 'Available' },
  { bloodGroup: 'B-', units: 5, status: 'Low' },
  { bloodGroup: 'AB+', units: 15, status: 'Available' },
  { bloodGroup: 'AB-', units: 3, status: 'Critical' }
]

// Dummy history data for hospital
export const dummyHistory = [
  {
    id: 1,
    type: 'Donation',
    bloodGroup: 'O+',
    units: 2,
    donorName: 'John Doe',
    date: '2024-02-15',
    time: '10:30 AM',
    status: 'Completed'
  },
  {
    id: 2,
    type: 'Request Fulfilled',
    bloodGroup: 'A+',
    units: 1,
    requesterName: 'Bob Miller',
    date: '2024-02-14',
    time: '2:15 PM',
    status: 'Completed'
  },
  {
    id: 3,
    type: 'Donation',
    bloodGroup: 'B+',
    units: 3,
    donorName: 'Mike Johnson',
    date: '2024-02-13',
    time: '9:00 AM',
    status: 'Completed'
  },
  {
    id: 4,
    type: 'Request Fulfilled',
    bloodGroup: 'AB+',
    units: 2,
    requesterName: 'Sarah Williams',
    date: '2024-02-12',
    time: '4:45 PM',
    status: 'Completed'
  },
  {
    id: 5,
    type: 'Donation',
    bloodGroup: 'O-',
    units: 1,
    donorName: 'David Brown',
    date: '2024-02-11',
    time: '11:20 AM',
    status: 'Completed'
  }
]

// Dummy donation history for donors
export const dummyDonationHistory = [
  {
    id: 1,
    date: '2024-02-15',
    hospital: 'City Hospital',
    bloodGroup: 'O+',
    units: 2,
    status: 'Completed',
    time: '10:30 AM'
  },
  {
    id: 2,
    date: '2024-01-15',
    hospital: 'General Hospital',
    bloodGroup: 'O+',
    units: 1,
    status: 'Completed',
    time: '2:00 PM'
  },
  {
    id: 3,
    date: '2023-12-10',
    hospital: 'Memorial Hospital',
    bloodGroup: 'O+',
    units: 2,
    status: 'Completed',
    time: '11:15 AM'
  },
  {
    id: 4,
    date: '2023-11-05',
    hospital: 'City Hospital',
    bloodGroup: 'O+',
    units: 1,
    status: 'Completed',
    time: '9:45 AM'
  }
]

// Dummy notifications for donors
export const dummyNotifications = [
  {
    id: 1,
    type: 'request',
    title: 'New Blood Request',
    message: 'City Hospital needs 2 units of O+ blood. High urgency.',
    date: '2024-02-16',
    time: '9:30 AM',
    read: false
  },
  {
    id: 2,
    type: 'reminder',
    title: 'Donation Reminder',
    message: 'You are eligible to donate again. Last donation was 30 days ago.',
    date: '2024-02-14',
    time: '3:15 PM',
    read: false
  },
  {
    id: 3,
    type: 'thank',
    title: 'Thank You!',
    message: 'Your donation on Feb 15 helped save 3 lives. Thank you for your contribution!',
    date: '2024-02-15',
    time: '5:00 PM',
    read: true
  },
  {
    id: 4,
    type: 'request',
    title: 'New Blood Request',
    message: 'General Hospital needs 1 unit of O+ blood. Medium urgency.',
    date: '2024-02-13',
    time: '10:20 AM',
    read: true
  }
]

// Blood groups list
export const bloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

