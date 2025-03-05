import { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function CourtEditModal({ isOpen, onClose, onSave, stadiumId, court }) {
  const [formData, setFormData] = useState({
    courtNumber: '',
    courtType: '',
    pricePerHour: '',
    sport: '',
    openingTime: '',
    closingTime: '',
    minimumBookingDuration: 60 // Default to 60 minutes
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (court) {
      setFormData({
        courtNumber: court.courtNumber || '',
        courtType: court.courtType || '',
        pricePerHour: court.pricePerHour || '',
        sport: court.sport || '',
        openingTime: court.openingTime || '',
        closingTime: court.closingTime || '',
        minimumBookingDuration: court.minimumBookingDuration || 60
      });
    } else {
      setFormData({
        courtNumber: '',
        courtType: '',
        pricePerHour: '',
        sport: '',
        openingTime: '',
        closingTime: '',
        minimumBookingDuration: 60
      });
    }
  }, [court]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'minimumBookingDuration' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (court) {
        // Update existing court
        const courtRef = doc(db, 'courts', court.id);
        await updateDoc(courtRef, {
          ...formData,
          stadiumId
        });
      } else {
        // Add new court
        const courtsRef = collection(db, 'courts');
        await addDoc(courtsRef, {
          ...formData,
          stadiumId
        });
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving court:', error);
      setError('Failed to save court. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date();
        time.setHours(hour, minute, 0);
        const timeString = time.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        options.push(timeString);
      }
    }
    return options;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6">
          {court ? 'Edit Court' : 'Add New Court'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Court Number</label>
            <input
              type="text"
              name="courtNumber"
              value={formData.courtNumber}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sport</label>
            <select
              name="sport"
              value={formData.sport}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select sport</option>
              <option value="Badminton">Badminton</option>
              <option value="Cricket">Cricket</option>
              <option value="Basketball">Basketball</option>
              <option value="Tennis">Tennis</option>
              <option value="Football">Football</option>
              <option value="Volleyball">Volleyball</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Court Type</label>
            <select
              name="courtType"
              value={formData.courtType}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select court type</option>
              <option value="Turf">Turf</option>
              <option value="Clay">Clay</option>
              <option value="Grass">Grass</option>
              <option value="Hard">Hard</option>
              <option value="Synthetic">Synthetic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price per Hour (₹)</label>
            <input
              type="number"
              name="pricePerHour"
              value={formData.pricePerHour}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              min="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Opening Time</label>
              <select
                name="openingTime"
                value={formData.openingTime}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select opening time</option>
                {generateTimeOptions().map((time, index) => (
                  <option key={index} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Closing Time</label>
              <select
                name="closingTime"
                value={formData.closingTime}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select closing time</option>
                {generateTimeOptions().map((time, index) => (
                  <option key={index} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Booking Duration</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="minimumBookingDuration"
                  value="30"
                  checked={formData.minimumBookingDuration === 30}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                30 minutes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="minimumBookingDuration"
                  value="60"
                  checked={formData.minimumBookingDuration === 60}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                1 hour
              </label>
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
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 