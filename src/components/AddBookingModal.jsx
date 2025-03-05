import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

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
    const startMinutes = convertTimeToMinutes(startTime);
    const endMinutes = convertTimeToMinutes(endTime);

    console.log('Checking availability for:', {
      startTime,
      endTime,
      startMinutes,
      endMinutes,
      bookedSlots: bookedSlots.map(booking => ({
        start: booking.timeSlot.startTime,
        end: booking.timeSlot.endTime
      }))
    });

    return !bookedSlots.some(booking => {
      const bookingStart = convertTimeToMinutes(booking.timeSlot.startTime);
      const bookingEnd = convertTimeToMinutes(booking.timeSlot.endTime);
      const isOverlapping = (startMinutes < bookingEnd && endMinutes > bookingStart);
      console.log('Checking overlap:', {
        bookingStart,
        bookingEnd,
        isOverlapping
      });
      return isOverlapping;
    });
  };

  const getCurrentISTTime = () => {
    const now = new Date();
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    return new Date(now.getTime() + istOffset);
  };

  const isSlotInPast = (startTime) => {
    const currentTime = getCurrentISTTime();
    const [time, period] = startTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    hours = hours % 12;
    if (period === 'PM') hours += 12;

    // Create slot time using the selected date
    const slotTime = new Date(formData.date);
    slotTime.setHours(hours, minutes, 0);

    // Convert both times to IST for comparison
    const currentIST = new Date(currentTime.getTime());
    const slotIST = new Date(slotTime.getTime());

    // If the slot is for today and is in the past (including 30 min buffer)
    if (slotIST.toDateString() === currentIST.toDateString()) {
      const thirtyMinutesAgo = new Date(currentIST.getTime() - 30 * 60 * 1000);
      return slotIST < thirtyMinutesAgo;
    }

    // If the slot is for a past date
    return slotIST < currentIST;
  };

  const generateAvailableSlots = () => {
    if (!selectedCourt || !formData.date || !formData.duration) {
      console.log('Missing required data:', { 
        selectedCourt: selectedCourt?.id, 
        date: formData.date, 
        duration: formData.duration 
      });
      return;
    }

    try {
      const slots = [];
      // Parse opening time (e.g., "05:00 AM")
      const [openingTime, openingPeriod] = selectedCourt.openingTime.split(' ');
      let [openingHour, openingMinute] = openingTime.split(':').map(Number);
      openingHour = openingHour % 12;
      if (openingPeriod === 'PM') openingHour += 12;

      // Parse closing time (e.g., "11:30 PM")
      const [closingTime, closingPeriod] = selectedCourt.closingTime.split(' ');
      let [closingHour, closingMinute] = closingTime.split(':').map(Number);
      closingHour = closingHour % 12;
      if (closingPeriod === 'PM') closingHour += 12;
      
      // Create opening time for the selected date
      let currentTime = new Date(formData.date);
      currentTime.setHours(openingHour, openingMinute, 0);
      
      // Create closing time for the selected date
      const closingTimeDate = new Date(formData.date);
      closingTimeDate.setHours(closingHour, closingMinute, 0);
      
      console.log('Generating slots between:', {
        opening: currentTime.toLocaleTimeString(),
        closing: closingTimeDate.toLocaleTimeString(),
        duration: formData.duration,
        courtHours: `${selectedCourt.openingTime} - ${selectedCourt.closingTime}`,
        currentIST: getCurrentISTTime().toLocaleString(),
        selectedDate: formData.date
      });

      // Generate slots in 30-minute intervals
      while (currentTime < closingTimeDate) {
        const startTime = currentTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        
        // Calculate end time based on duration
        const endTime = new Date(currentTime);
        endTime.setMinutes(currentTime.getMinutes() + formData.duration);
        
        if (endTime <= closingTimeDate) {
          const endTimeStr = endTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          // Only add slot if it's available and not in the past
          if (isTimeSlotAvailable(startTime, endTimeStr) && !isSlotInPast(startTime)) {
            slots.push({ startTime, endTime: endTimeStr });
          }
        }
        
        // Move to next 30-minute interval
        currentTime.setMinutes(currentTime.getMinutes() + 30);
      }
      
      console.log('Available slots:', slots);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error generating slots:', error);
      setError('Error generating time slots. Please try again.');
    }
  };

  useEffect(() => {
    console.log('Effect triggered with:', {
      date: formData.date,
      duration: formData.duration,
      selectedCourt: selectedCourt?.id,
      bookedSlots: bookedSlots.length,
      courtHours: selectedCourt ? `${selectedCourt.openingTime} - ${selectedCourt.closingTime}` : null
    });
    generateAvailableSlots();
  }, [formData.date, formData.duration, selectedCourt, bookedSlots]);

  const calculatePrice = () => {
    if (!selectedCourt || !formData.duration) return 0;
    const durationInHours = formData.duration / 60;
    return Math.round(durationInHours * selectedCourt.pricePerHour);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', { name, value });
    
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
    console.log('Court changed:', { 
      courtId, 
      court,
      openingTime: court?.openingTime,
      closingTime: court?.closingTime
    });
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
      
      onSave();
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
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
              <label className="block text-sm font-medium text-gray-700">Select Court</label>
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
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="mt-1 text-sm text-gray-500">
              Select a date to view available time slots
            </p>
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
                <p>Court hours: {selectedCourt.openingTime} - {selectedCourt.closingTime}</p>
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
                <li>Slots are not in the past (current time: {getCurrentISTTime().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })})</li>
              </ul>
            </div>
          )}

          {availableSlots.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
              <div className="h-16 overflow-x-auto">
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSlotSelect(slot)}
                      className={`p-1.5 border rounded-md text-xs whitespace-nowrap ${
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
  );
} 