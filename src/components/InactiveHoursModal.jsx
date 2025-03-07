import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import SuccessAnimation from './SuccessAnimation';

export default function InactiveHoursModal({ isOpen, onClose, onSave, courts }) {
  const { managerData } = useAuth();
  const [formData, setFormData] = useState({
    courtId: '',
    date: '',
    startTime: '',
    endTime: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [selectAllCourts, setSelectAllCourts] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Set today's date as default
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        courtId: '',
        date: today,
        startTime: '',
        endTime: '',
      });
      setError('');
      setSelectAllCourts(false);
      setSelectedCourt(null);
    }
  }, [isOpen]);

  const generateTimeOptions = () => {
    if (!selectedCourt) return [];

    const options = [];
    const [openingTime, openingPeriod] = selectedCourt.openingTime.split(' ');
    const [closingTime, closingPeriod] = selectedCourt.closingTime.split(' ');
    
    let [openingHour, openingMinute] = openingTime.split(':').map(Number);
    let [closingHour, closingMinute] = closingTime.split(':').map(Number);
    
    // Convert to 24-hour format
    openingHour = openingHour % 12;
    if (openingPeriod === 'PM') openingHour += 12;
    
    closingHour = closingHour % 12;
    if (closingPeriod === 'PM') closingHour += 12;

    // Create time slots
    const startDate = new Date();
    startDate.setHours(openingHour, openingMinute, 0);
    
    const endDate = new Date();
    endDate.setHours(closingHour, closingMinute, 0);

    while (startDate <= endDate) {
      const timeString = startDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      options.push(timeString);
      startDate.setMinutes(startDate.getMinutes() + 30); // 30-minute intervals
    }

    return options;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'courtId') {
      const court = courts.find(c => c.id === value);
      setSelectedCourt(court);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        startTime: '', // Reset time selections when court changes
        endTime: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!managerData?.id) {
        throw new Error('Manager data not available');
      }

      const targetCourts = selectAllCourts ? courts : [courts.find(c => c.id === formData.courtId)];
      const batch = writeBatch(db);
      const bookingsRef = collection(db, 'bookings');

      // Create inactive bookings for all selected courts in a single batch
      targetCourts.forEach(court => {
        const newBookingRef = doc(bookingsRef); // Create a new document reference
        const inactiveData = {
          amount: null,
          coachId: null,
          courtId: court.id,
          date: formData.date,
          stadiumId: managerData.stadiumID,
          status: 'inactive',
          timeSlot: {
            startTime: formData.startTime,
            endTime: formData.endTime
          },
          userId: managerData.id
        };
        batch.set(newBookingRef, inactiveData);
      });

      // Commit the batch
      await batch.commit();
      
      // Show success animation
      setShowSuccessAnimation(true);
      
      // Wait for animation to complete before closing
      setTimeout(() => {
        setShowSuccessAnimation(false);
        onSave();
      }, 2000);
      
    } catch (error) {
      console.error('Error setting inactive hours:', error);
      setError(error.message || 'Failed to set inactive hours. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = generateTimeOptions();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-6">Set Inactive Hours</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Court Selection
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="selectAllCourts"
                  checked={selectAllCourts}
                  onChange={(e) => {
                    setSelectAllCourts(e.target.checked);
                    if (e.target.checked) {
                      setSelectedCourt(courts[0]); // Use first court for time range
                    } else {
                      setSelectedCourt(null);
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="selectAllCourts" className="text-sm text-gray-700">
                  Select All Courts
                </label>
              </div>
              {!selectAllCourts && (
                <select
                  name="courtId"
                  value={formData.courtId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required={!selectAllCourts}
                >
                  <option value="">Select a court</option>
                  {courts.map((court) => (
                    <option key={court.id} value={court.id}>
                      Court {court.courtNumber} - {court.sport}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <select
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!selectedCourt}
                >
                  <option value="">Select time</option>
                  {timeOptions.map((time, index) => (
                    <option 
                      key={index} 
                      value={time}
                      disabled={time >= formData.endTime && formData.endTime !== ''}
                    >
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <select
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!selectedCourt}
                >
                  <option value="">Select time</option>
                  {timeOptions.map((time, index) => (
                    <option 
                      key={index} 
                      value={time}
                      disabled={time <= formData.startTime}
                    >
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (!selectAllCourts && !formData.courtId)}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                  (loading || (!selectAllCourts && !formData.courtId)) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Inactive Hours'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <SuccessAnimation 
        isVisible={showSuccessAnimation} 
        onAnimationComplete={() => {
          setShowSuccessAnimation(false);
          onSave();
        }}
      />
    </>
  );
} 