import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, collectionGroup } from 'firebase/firestore';
import { db } from '../firebase';

export default function ExpiryBookingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('bookings');
  const [currentPage, setCurrentPage] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortAscending, setSortAscending] = useState(true);
  const itemsPerPage = 10;

  // Expanded dummy data for expiring subscriptions
  const expiringSubscriptions = [
    {
      id: 1,
      name: "John Smith",
      coach: "Mike Johnson",
      courtNumber: "Court 1",
      subscriptionStart: "2024-03-01",
      subscriptionEnd: "2024-03-20",
      amountPaid: 5000,
      status: "Expiring Soon"
    },
    {
      id: 2,
      name: "Emma Wilson",
      coach: "Sarah Davis",
      courtNumber: "Court 3",
      subscriptionStart: "2024-02-15",
      subscriptionEnd: "2024-03-15",
      amountPaid: 6000,
      status: "Expired"
    },
    {
      id: 3,
      name: "Michael Brown",
      coach: "David Wilson",
      courtNumber: "Court 2",
      subscriptionStart: "2024-03-10",
      subscriptionEnd: "2024-04-10",
      amountPaid: 5500,
      status: "Expiring Soon"
    },
    {
      id: 4,
      name: "Sarah Johnson",
      coach: "Mike Johnson",
      courtNumber: "Court 1",
      subscriptionStart: "2024-02-01",
      subscriptionEnd: "2024-03-01",
      amountPaid: 4500,
      status: "Expired"
    },
    {
      id: 5,
      name: "James Williams",
      coach: "Sarah Davis",
      courtNumber: "Court 4",
      subscriptionStart: "2024-03-15",
      subscriptionEnd: "2024-04-15",
      amountPaid: 5200,
      status: "Expiring Soon"
    }
  ];

  useEffect(() => {
    if (isOpen && activeTab === 'bookings') {
      fetchRecentBookings();
    }
  }, [isOpen, activeTab]);

  const getBookingStatus = (booking) => {
    const bookingDate = new Date(booking.date);
    const now = new Date();
    
    // Set times to midnight for date comparison
    bookingDate.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return 'expired';
    }
    return booking.status || 'pending';
  };

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleSort = () => {
    setSortAscending(!sortAscending);
    setBookings(prevBookings => [...prevBookings].reverse());
  };

  const fetchRecentBookings = async () => {
    try {
      setLoading(true);
      setError('');

      // Single call to get all bookings
      const bookingsRef = collection(db, 'bookings');
      const bookingsSnapshot = await getDocs(bookingsRef);
      const allBookings = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Process and filter bookings on client side
      const today = new Date();
      const tenDaysAgo = new Date(today);
      tenDaysAgo.setDate(today.getDate() - 10);
      const tenDaysLater = new Date(today);
      tenDaysLater.setDate(today.getDate() + 10);

      const startDate = tenDaysAgo.toISOString().split('T')[0];
      const endDate = tenDaysLater.toISOString().split('T')[0];

      // Filter bookings by date on client side
      const filteredBookings = allBookings.filter(booking => {
        if (!booking.date) return false;
        const bookingDate = new Date(booking.date).toISOString().split('T')[0];
        return bookingDate >= startDate && bookingDate <= endDate;
      });

      if (filteredBookings.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      // Get unique IDs
      const uniqueUserIds = [...new Set(filteredBookings.map(b => b.userId).filter(Boolean))];
      const uniqueCourtIds = [...new Set(filteredBookings.map(b => b.courtId).filter(Boolean))];

      // Single batch call for users
      const usersData = uniqueUserIds.length > 0 ? await Promise.all(
        uniqueUserIds.map(id => getDoc(doc(db, 'users', id)))
      ) : [];

      // Single batch call for courts
      const courtsData = uniqueCourtIds.length > 0 ? await Promise.all(
        uniqueCourtIds.map(id => getDoc(doc(db, 'courts', id)))
      ) : [];

      // Create lookup maps
      const userMap = new Map(
        usersData
          .filter(doc => doc.exists())
          .map(doc => [doc.id, doc.data().name])
      );

      const courtMap = new Map(
        courtsData
          .filter(doc => doc.exists())
          .map(doc => [doc.id, doc.data().courtNumber])
      );

      // Process all bookings at once
      const processedBookings = filteredBookings.map(booking => ({
        ...booking,
        userName: booking.userId ? (userMap.get(booking.userId) || 'Manager') : 'Manager',
        courtNumber: booking.courtId ? (courtMap.get(booking.courtId) || 'Unknown Court') : 'Unknown Court',
        status: getBookingStatus(booking)
      }));

      // Sort by date (ascending by default)
      processedBookings.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortAscending ? dateA - dateB : dateB - dateA;
      });

      setBookings(processedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to fetch bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentItems = () => {
    const items = activeTab === 'bookings' ? bookings : expiringSubscriptions;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(
    (activeTab === 'bookings' ? bookings.length : expiringSubscriptions.length) / itemsPerPage
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Expiries & Bookings</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'bookings'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setActiveTab('bookings');
              setCurrentPage(1);
            }}
          >
            Recent Bookings
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'expiring'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setActiveTab('expiring');
              setCurrentPage(1);
            }}
          >
            Expiring Subscriptions
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {activeTab === 'bookings' ? (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider group">
                          <div className="flex items-center gap-2 cursor-pointer" onClick={toggleSort}>
                            Date
                            <ArrowUpDown size={14} className="text-gray-400" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getCurrentItems().map((item) => (
                    <tr key={item.id}>
                      {activeTab === 'bookings' ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.userName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Court {item.courtNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.timeSlot.startTime} - {item.timeSlot.endTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyle(item.status)}`}>
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.coach}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.courtNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(item.subscriptionStart).toLocaleDateString()} - 
                            {new Date(item.subscriptionEnd).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.amountPaid}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              item.status === 'Expiring Soon'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Showing page {currentPage} of {totalPages}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 