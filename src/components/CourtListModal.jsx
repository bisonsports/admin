import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Pencil, Plus, Calendar, Trash2 } from 'lucide-react';
import CourtEditModal from './CourtEditModal';
import CourtBookingsModal from './CourtBookingsModal';

export default function CourtListModal({ isOpen, onClose, stadiumId }) {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBookingsModalOpen, setIsBookingsModalOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [courtToDelete, setCourtToDelete] = useState(null);

  useEffect(() => {
    if (isOpen && stadiumId) {
      fetchCourts();
    }
  }, [isOpen, stadiumId]);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const courtsRef = collection(db, 'courts');
      const q = query(courtsRef, where('stadiumId', '==', stadiumId));
      const querySnapshot = await getDocs(q);
      
      const courtsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCourts(courtsData);
      setError('');
    } catch (error) {
      console.error('Error fetching courts:', error);
      setError('Failed to fetch courts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (court) => {
    setSelectedCourt(court);
    setIsEditModalOpen(true);
  };

  const handleViewBookings = (court) => {
    setSelectedCourt(court);
    setIsBookingsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCourt(null);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (court) => {
    try {
      setLoading(true);
      const courtRef = doc(db, 'courts', court.id);
      await deleteDoc(courtRef);
      
      // Update the local state
      setCourts(prevCourts => prevCourts.filter(c => c.id !== court.id));
      setCourtToDelete(null);
      setError('');
    } catch (error) {
      console.error('Error deleting court:', error);
      setError('Failed to delete court. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Court Management</h2>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={20} />
            Add New Court
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading courts...</div>
        ) : courts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No courts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sport</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Hour</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courts.map((court) => (
                  <tr key={court.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{court.courtNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{court.sport}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{court.courtType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{court.pricePerHour}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {court.openingTime} - {court.closingTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewBookings(court)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Bookings"
                        >
                          <Calendar size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(court)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Court"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => setCourtToDelete(court)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Court"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {courtToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Court</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete Court {courtToDelete.courtNumber}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setCourtToDelete(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(courtToDelete)}
                disabled={loading}
                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CourtEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCourt(null);
        }}
        onSave={() => {
          setIsEditModalOpen(false);
          setSelectedCourt(null);
          fetchCourts();
        }}
        stadiumId={stadiumId}
        court={selectedCourt}
      />

      <CourtBookingsModal
        isOpen={isBookingsModalOpen}
        onClose={() => {
          setIsBookingsModalOpen(false);
          setSelectedCourt(null);
        }}
        court={selectedCourt}
      />
    </div>
  );
} 