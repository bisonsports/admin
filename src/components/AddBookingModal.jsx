import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import SuccessAnimation from './SuccessAnimation';

export default function AddBookingModal({ isOpen, onClose, onSave, court }) {
  const { managerData } = useAuth();
  const [formData, setFormData] = useState({
    courtId: '',
    date: '',
    duration: 0,
    coachId: '',
    status: 'confirmed'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set today's date as default
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        courtId: '',
        date: today,
        duration: 0,
        coachId: '',
        status: 'confirmed'
      });
      setError('');
      if (!court) {
        fetchCourts();
      } else {
        setSelectedCourt(court);
        setFormData(prev => ({ 
          ...prev, 
          courtId: court.id,
          date: today,
          duration: court.minimumBookingDuration || 60 
        }));
      }
    }
  }, [isOpen, court]);

  const fetchCourts = async () => {
    try {
      const courtsRef = collection(db, 'courts');
      const q = query(courtsRef, where('stadiumId', '==', managerData.stadiumID));
      const querySnapshot = await getDocs(q);
      
      const courtsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCourts(courtsData);
    } catch (error) {
      console.error('Error fetching courts:', error);
      setError('Failed to fetch courts. Please try again.');
    }
  };

  const fetchBookedSlots = async () => {
    if (!formData.date || !formData.courtId) return;

    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('courtId', '==', formData.courtId),
        where('date', '==', formData.date)
      );
      const querySnapshot = await getDocs(q);
      
      const bookedSlotsData = querySnapshot.docs.map(doc => ({
        ...doc.data()
      }));
      
      setBookedSlots(bookedSlotsData);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  useEffect(() => {
    if (formData.date && formData.courtId) {
      fetchBookedSlots();
    }
  }, [formData.date, formData.courtId]);

  const convertTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    hours = hours % 12;
    if (period === 'PM') hours += 12;
    return hours * 60 + minutes;
  };

  const convertMinutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const isTimeSlotAvailable = (startTime, endTime) => {
    if (!startTime || !endTime) return false;
    
    const startMinutes = convertTimeToMinutes(startTime);
    const endMinutes = convertTimeToMinutes(endTime);

    return !bookedSlots.some(booking => {
      const bookingStart = convertTimeToMinutes(booking.timeSlot.startTime);
      const bookingEnd = convertTimeToMinutes(booking.timeSlot.endTime);
      return (startMinutes < bookingEnd && endMinutes > bookingStart);
    });
  };

  const getCurrentISTTime = () => {
    // Get current time in IST
    const now = new Date();
    const istOptions = { 
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return now.toLocaleTimeString('en-US', istOptions);
  };

  const isSlotInPast = (startTime) => {
    if (!startTime) return true;
    
    // Get current time in IST
    const now = new Date();
    const currentIST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    // Parse the slot time
    const [time, period] = startTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    hours = hours % 12;
    if (period === 'PM') hours += 12;

    // Create slot time using the selected date
    const slotTime = new Date(formData.date);
    slotTime.setHours(hours, minutes, 0);

    // If the slot is for today
    if (slotTime.toDateString() === currentIST.toDateString()) {
        // Allow slots that are within the next 30 minutes from current time
        const thirtyMinutesFromNow = new Date(currentIST.getTime() + 30 * 60 * 1000);
        return slotTime < currentIST && slotTime < thirtyMinutesFromNow;
    }

    // For future dates, only check if the slot is in the past
    return slotTime < currentIST;
  };

  const generateAvailableSlots = () => {
    if (!selectedCourt?.openingTime || !selectedCourt?.closingTime || !formData.date || !formData.duration) {
        setAvailableSlots([]);
        return;
    }

    try {
        const slots = [];
        const [openingTime, openingPeriod] = selectedCourt.openingTime.split(' ');
        let [openingHour, openingMinute] = openingTime.split(':').map(Number);
        openingHour = openingHour % 12;
        if (openingPeriod === 'PM') openingHour += 12;

        const [closingTime, closingPeriod] = selectedCourt.closingTime.split(' ');
        let [closingHour, closingMinute] = closingTime.split(':').map(Number);
        closingHour = closingHour % 12;
        if (closingPeriod === 'PM') closingHour += 12;
        
        // Create dates in IST
        let currentTime = new Date(formData.date);
        currentTime.setHours(openingHour, openingMinute, 0);
        
        const closingTimeDate = new Date(formData.date);
        closingTimeDate.setHours(closingHour, closingMinute, 0);
        
        while (currentTime < closingTimeDate) {
            const startTime = currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata'
            });
            
            const endTime = new Date(currentTime);
            endTime.setMinutes(currentTime.getMinutes() + formData.duration);
            
            if (endTime <= closingTimeDate) {
                const endTimeStr = endTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Asia/Kolkata'
                });
                
                if (isTimeSlotAvailable(startTime, endTimeStr) && !isSlotInPast(startTime)) {
                    slots.push({ startTime, endTime: endTimeStr });
                }
            }
            
            currentTime.setMinutes(currentTime.getMinutes() + 30);
        }
        
        setAvailableSlots(slots);
    } catch (error) {
        setError('Error generating time slots. Please try again.');
        setAvailableSlots([]);
    }
  };

  useEffect(() => {
    generateAvailableSlots();
  }, [formData.date, formData.duration, selectedCourt, bookedSlots]);

  const calculatePrice = () => {
    if (!selectedCourt || !formData.duration) return 0;
    const durationInHours = formData.duration / 60;
    return Math.round(durationInHours * selectedCourt.pricePerHour);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Ensure date is not empty
    if (name === 'date' && !value) {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        [name]: today
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'duration' ? Number(value) : value
      }));
    }
  };

  const handleCourtChange = (e) => {
    const courtId = e.target.value;
    const court = courts.find(c => c.id === courtId);
    setSelectedCourt(court);
    setFormData(prev => ({ 
      ...prev, 
      courtId,
      duration: court.minimumBookingDuration || 60 
    }));
  };

  const handleAddDuration = () => {
    setFormData(prev => ({
      ...prev,
      duration: prev.duration + (selectedCourt.minimumBookingDuration || 60)
    }));
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!managerData?.id) {
        throw new Error('Manager data not available');
      }

      if (!selectedSlot) {
        throw new Error('Please select a time slot');
      }

      // Calculate amount
      const durationInHours = formData.duration / 60;
      const amount = Math.round(durationInHours * selectedCourt.pricePerHour);

      const bookingData = {
        userId: managerData.id,
        stadiumId: managerData.stadiumID,
        courtId: formData.courtId,
        coachId: formData.coachId || null,
        date: formData.date,
        timeSlot: {
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime
        },
        status: formData.status,
        amount
      };

      const bookingsRef = collection(db, 'bookings');
      await addDoc(bookingsRef, bookingData);
      
      // Show success animation
      setShowSuccessAnimation(true);
      
      // Wait for animation to complete before closing
      setTimeout(() => {
        setShowSuccessAnimation(false);
        onSave();
      }, 2000); // 2 seconds for the animation
      
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-6">Add New Booking</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!court && (
              <div>
                <select
                  name="courtId"
                  value={formData.courtId}
                  onChange={handleCourtChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a court</option>
                  {courts.map((court) => (
                    <option key={court.id} value={court.id}>
                      Court {court.courtNumber} - {court.sport}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  min={selectedCourt?.minimumBookingDuration || 60}
                  step={selectedCourt?.minimumBookingDuration || 60}
                  disabled={!selectedCourt}
                />
                <button
                  type="button"
                  onClick={handleAddDuration}
                  className="mt-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={!selectedCourt}
                >
                  Add {selectedCourt?.minimumBookingDuration || 60} min
                </button>
              </div>
              {selectedCourt && (
                <div className="mt-1 text-sm text-gray-500">
                  <p>Minimum duration: {selectedCourt.minimumBookingDuration || 60} minutes</p>
                  <p>Price: ₹{calculatePrice()}</p>
                </div>
              )}
            </div>

            {availableSlots.length === 0 && formData.date && formData.duration && (
              <div className="text-sm text-gray-500">
                <p>No available slots found for the selected duration.</p>
                <p>Please check:</p>
                <ul className="list-disc pl-5">
                  <li>Selected date is valid</li>
                  <li>Duration is within court hours</li>
                  <li>Duration is a multiple of {selectedCourt?.minimumBookingDuration || 60} minutes</li>
                  <li>No overlapping bookings exist</li>
                  <li>Slots are not in the past (current time: {getCurrentISTTime()})</li>
                </ul>
              </div>
            )}

            {availableSlots.length > 0 && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
                <div className="h-10 overflow-x-auto border border-gray-300 rounded-md">
                  <div className="flex flex-nowrap gap-2">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSlotSelect(slot)}
                        className={`p-1 border rounded-md text-xs whitespace-nowrap ${
                          selectedSlot?.startTime === slot.startTime
                            ? 'bg-blue-100 border-blue-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {slot.startTime} - {slot.endTime}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Scroll buttons */}
                <div className="flex justify-center mt-2 space-x-2">
                  <button
                    type="button"
                    onClick={() => document.querySelector('.overflow-x-auto').scrollBy({ left: -100, behavior: 'smooth' })}
                    className="px-3 py-1 bg-gray-300 rounded-md hover:bg-gray-400 text-xs transition duration-200 ease-in-out transform hover:scale-105"
                  >
                    &lt;
                  </button>
                  <button
                    type="button"
                    onClick={() => document.querySelector('.overflow-x-auto').scrollBy({ left: 100, behavior: 'smooth' })}
                    className="px-3 py-1 bg-gray-300 rounded-md hover:bg-gray-400 text-xs transition duration-200 ease-in-out transform hover:scale-105"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Coach ID (Optional)</label>
              <input
                type="text"
                name="coachId"
                value={formData.coachId}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter coach ID"
              />
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
                disabled={loading || !selectedSlot}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                  (loading || !selectedSlot) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Creating...' : 'Create Booking'}
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