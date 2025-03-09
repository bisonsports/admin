import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { X, Plus, Users } from 'lucide-react';
import SuccessAnimation from './SuccessAnimation';

export default function CoachesModal({ isOpen, onClose, stadiumId }) {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    courtId: '',
    timings: {
      start: '',
      end: ''
    },
    startDate: '',
    subscriptionPeriod: 'monthly',
    experience: '',
    specialization: '',
    sessionPrice: '',
  });

  // State for courts list
  const [courts, setCourts] = useState([]);

  // Subscription period options
  const subscriptionPeriods = [
    { value: 'monthly', label: 'Monthly', months: 1 },
    { value: 'quarterly', label: 'Quarterly', months: 3 },
    { value: 'half_year', label: 'Half Year', months: 6 },
    { value: 'annually', label: 'Annually', months: 12 },
  ];

  // Convert 24h to 12h format
  const convertTo12Hour = (time24) => {
    const [hours24, minutes] = time24.split(':');
    const hours = parseInt(hours24, 10);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hours12.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  // Convert 12h to 24h format
  const convertTo24Hour = (time12) => {
    const [time, period] = time12.split(' ');
    const [hours12, minutes] = time.split(':');
    let hours24 = parseInt(hours12, 10);
    
    if (hours24 === 12) {
      hours24 = period === 'PM' ? 12 : 0;
    } else {
      hours24 = period === 'PM' ? hours24 + 12 : hours24;
    }
    
    return `${hours24.toString().padStart(2, '0')}:${minutes}`;
  };

  // Generate time slots (30-minute intervals in 12-hour format)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of ['00', '30']) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute}`;
        options.push(convertTo12Hour(time24));
      }
    }
    return options;
  };

  useEffect(() => {
    if (isOpen && stadiumId) {
      fetchCoaches();
      fetchCourts();
    }
  }, [isOpen, stadiumId]);

  const fetchCourts = async () => {
    try {
      const courtsRef = collection(db, 'courts');
      const q = query(courtsRef, where('stadiumId', '==', stadiumId));
      const courtsSnapshot = await getDocs(q);
      const courtsData = courtsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourts(courtsData);
    } catch (error) {
      console.error('Error fetching courts:', error);
    }
  };

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const coachesRef = collection(db, 'coaches');
      const q = query(coachesRef, where('stadiumId', '==', stadiumId));
      const coachesSnapshot = await getDocs(q);
      
      const coachesData = await Promise.all(coachesSnapshot.docs.map(async docSnapshot => {
        const coach = docSnapshot.data();
        let courtData = { courtNumber: 'Unknown Court' };
        
        if (coach.courtId) {
          const courtDocRef = doc(db, 'courts', coach.courtId);
          const courtDocSnapshot = await getDoc(courtDocRef);
          if (courtDocSnapshot.exists()) {
            courtData = courtDocSnapshot.data();
          }
        }

        // Calculate days left for renewal
        const startDate = new Date(coach.startDate || new Date());
        const today = new Date();
        const monthsElapsed = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                            today.getMonth() - startDate.getMonth();
        const nextRenewalDate = new Date(startDate);
        nextRenewalDate.setMonth(startDate.getMonth() + (Math.floor(monthsElapsed / 3) + 1) * 3);
        const daysLeft = Math.ceil((nextRenewalDate - today) / (1000 * 60 * 60 * 24));

        // Ensure timings object exists with default values and convert to 12-hour format
        const timings = coach.timings || { start: 'N/A', end: 'N/A' };
        const formattedTimings = {
          start: timings.start !== 'N/A' ? timings.start : 'N/A',
          end: timings.end !== 'N/A' ? timings.end : 'N/A'
        };

        return {
          id: docSnapshot.id,
          ...coach,
          courtNumber: courtData.courtNumber,
          daysLeftForRenewal: daysLeft,
          timings: formattedTimings
        };
      }));

      setCoaches(coachesData);
    } catch (error) {
      console.error('Error fetching coaches:', error);
      setError('Failed to fetch coaches');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoach = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const coachesRef = collection(db, 'coaches');
      
      // Calculate end date based on subscription period
      const startDate = new Date(formData.startDate);
      const selectedPeriod = subscriptionPeriods.find(p => p.value === formData.subscriptionPeriod);
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + selectedPeriod.months);

      await addDoc(coachesRef, {
        ...formData,
        stadiumId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        createdAt: new Date().toISOString(),
        members: 0,
        timings: {
          start: formData.timings.start,
          end: formData.timings.end
        }
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowAddForm(false);
        setFormData({
          name: '',
          courtId: '',
          timings: {
            start: '',
            end: ''
          },
          startDate: '',
          subscriptionPeriod: 'monthly',
          experience: '',
          specialization: '',
          sessionPrice: '',
        });
      }, 2000);

      fetchCoaches();
    } catch (error) {
      console.error('Error adding coach:', error);
      setError('Failed to add coach');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const timeOptions = generateTimeOptions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Coaches</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus size={20} />
              Add Coach
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {showAddForm ? (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Coach</h3>
            <form onSubmit={handleAddCoach} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Court
                </label>
                <select
                  required
                  value={formData.courtId}
                  onChange={(e) => setFormData(prev => ({ ...prev, courtId: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select Court</option>
                  {courts.map(court => (
                    <option key={court.id} value={court.id}>
                      {court.sport} - Court {court.courtNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <select
                  required
                  value={formData.timings.start}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    timings: { ...prev.timings, start: e.target.value }
                  }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select Start Time</option>
                  {timeOptions.map(time => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <select
                  required
                  value={formData.timings.end}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    timings: { ...prev.timings, end: e.target.value }
                  }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select End Time</option>
                  {timeOptions.map(time => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Period
                </label>
                <select
                  required
                  value={formData.subscriptionPeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, subscriptionPeriod: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  {subscriptionPeriods.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience (years)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  required
                  value={formData.specialization}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Per Session Price (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.sessionPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, sessionPrice: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="col-span-2 flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add Coach
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Session</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coaches.map((coach) => (
                    <tr key={coach.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coach.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {coach.sport ? `${coach.sport} - ` : ''}Court {coach.courtNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {coach.timings.start} - {coach.timings.end}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(coach.startDate || new Date()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          coach.daysLeftForRenewal <= 7
                            ? 'bg-red-100 text-red-800'
                            : coach.daysLeftForRenewal <= 15
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {coach.daysLeftForRenewal} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Users size={16} className="text-gray-400" />
                          {coach.members || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coach.experience || 0} years</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{coach.sessionPrice || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      
      <SuccessAnimation 
        isVisible={showSuccess} 
        onAnimationComplete={() => setShowSuccess(false)} 
      />
    </div>
  );
} 