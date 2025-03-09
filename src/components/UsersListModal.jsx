import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function UsersListModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('trainees');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dummy data for trainees
  const trainees = [
    {
      id: 1,
      name: "John Smith",
      coach: "Mike Johnson",
      court: "Court 1",
      sport: "Badminton",
      timing: "06:00 AM - 07:00 AM",
      subscriptionStart: "2024-03-01",
      subscriptionEnd: "2024-04-01",
      amountPaid: 5000,
      isActive: true
    },
    {
      id: 2,
      name: "Emma Wilson",
      coach: "Sarah Davis",
      court: "Court 3",
      sport: "Tennis",
      timing: "07:00 AM - 08:00 AM",
      subscriptionStart: "2024-02-15",
      subscriptionEnd: "2024-03-15",
      amountPaid: 6000,
      isActive: true
    },
    {
      id: 3,
      name: "Michael Brown",
      coach: "David Wilson",
      court: "Court 2",
      sport: "Badminton",
      timing: "08:00 AM - 09:00 AM",
      subscriptionStart: "2024-01-01",
      subscriptionEnd: "2024-02-01",
      amountPaid: 5500,
      isActive: false
    },
    {
      id: 4,
      name: "Michael Brown",
      coach: "David Wilson",
      court: "Court 2",
      sport: "Badminton",
      timing: "08:00 AM - 09:00 AM",
      subscriptionStart: "2024-01-01",
      subscriptionEnd: "2024-02-01",
      amountPaid: 5500,
      isActive: false
    },
    {
      id: 5,
      name: "Michael Brown",
      coach: "David Wilson",
      court: "Court 2",
      sport: "Badminton",
      timing: "08:00 AM - 09:00 AM",
      subscriptionStart: "2024-01-01",
      subscriptionEnd: "2024-02-01",
      amountPaid: 5500,
      isActive: false
    },
    {
      id: 6,
      name: "Michael Brown",
      coach: "David Wilson",
      court: "Court 2",
      sport: "Badminton",
      timing: "08:00 AM - 09:00 AM",
      subscriptionStart: "2024-01-01",
      subscriptionEnd: "2024-02-01",
      amountPaid: 5500,
      isActive: false
    },
    {
      id: 7,
      name: "Michael Brown",
      coach: "David Wilson",
      court: "Court 2",
      sport: "Badminton",
      timing: "08:00 AM - 09:00 AM",
      subscriptionStart: "2024-01-01",
      subscriptionEnd: "2024-02-01",
      amountPaid: 5500,
      isActive: false
    },
    {
      id: 8,
      name: "Michael Brown",
      coach: "David Wilson",
      court: "Court 2",
      sport: "Badminton",
      timing: "08:00 AM - 09:00 AM",
      subscriptionStart: "2024-01-01",
      subscriptionEnd: "2024-02-01",
      amountPaid: 5500,
      isActive: false
    },
    {
      id: 9,
      name: "Michael Brown",
      coach: "David Wilson",
      court: "Court 2",
      sport: "Badminton",
      timing: "08:00 AM - 09:00 AM",
      subscriptionStart: "2024-01-01",
      subscriptionEnd: "2024-02-01",
      amountPaid: 5500,
      isActive: false
    },
    {
      id: 10,
      name: "Michael Brown",
      coach: "David Wilson",
      court: "Court 2",
      sport: "Badminton",
      timing: "08:00 AM - 09:00 AM",
      subscriptionStart: "2024-01-01",
      subscriptionEnd: "2024-02-01",
      amountPaid: 5500,
      isActive: false
    },
    // Add more dummy data here...
    {
      id: 20,
      name: "Sophie Turner",
      coach: "James Miller",
      court: "Court 4",
      sport: "Tennis",
      timing: "05:00 PM - 06:00 PM",
      subscriptionStart: "2024-03-10",
      subscriptionEnd: "2024-04-10",
      amountPaid: 5800,
      isActive: true
    }
  ];

  // Dummy data for booking users
  const bookingUsers = [
    {
      id: 1,
      name: "Alex Johnson",
      court: "Court 1",
      timing: "09:00 AM - 10:00 AM",
      date: "2024-03-15",
      bookingAmount: 800,
      status: "Active"
    },
    {
      id: 2,
      name: "Lisa Chen",
      court: "Court 2",
      timing: "10:00 AM - 11:00 AM",
      date: "2024-03-14",
      bookingAmount: 900,
      status: "Expired"
    },
    // Add more dummy booking data...
  ];

  const totalPages = Math.ceil(
    (activeTab === 'trainees' ? trainees.length : bookingUsers.length) / itemsPerPage
  );

  const getCurrentItems = () => {
    const items = activeTab === 'trainees' ? trainees : bookingUsers;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Users List</h2>
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
              activeTab === 'trainees'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setActiveTab('trainees');
              setCurrentPage(1);
            }}
          >
            Trainees
          </button>
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
            Booking Users
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeTab === 'trainees' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court & Sport</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getCurrentItems().map((item) => (
                <tr key={item.id}>
                  {activeTab === 'trainees' ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.coach}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.court} - {item.sport}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.timing}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.subscriptionStart).toLocaleDateString()} - 
                        {new Date(item.subscriptionEnd).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.amountPaid}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.isActive ? 'Active' : 'Expired'}
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.court}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.date).toLocaleDateString()} {item.timing}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.bookingAmount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'Active'
                            ? 'bg-green-100 text-green-800'
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
      </div>
    </div>
  );
} 