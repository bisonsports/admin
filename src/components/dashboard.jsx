import { Users, CreditCard, UserCheck, Calendar, BarChart3, MapPin, Link, List, Pencil } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useState, useEffect } from "react"
import EditStadiumModal from "./EditStadiumModal"
import CourtListModal from "./CourtListModal"
import UsersListModal from "./UsersListModal"
import ExpiryBookingsModal from "./ExpiryBookingsModal"
import CoachesModal from "./CoachesModal"
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const Dashboard = () => {
  const { stadiumData, managerData } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCourtListModalOpen, setIsCourtListModalOpen] = useState(false);
  const [isUsersListModalOpen, setIsUsersListModalOpen] = useState(false);
  const [isExpiryBookingsModalOpen, setIsExpiryBookingsModalOpen] = useState(false);
  const [isCoachesModalOpen, setIsCoachesModalOpen] = useState(false);
  const [courtCount, setCourtCount] = useState(0);
  const [selectedVenue, setSelectedVenue] = useState('');

  const venues = [
    "Flair Gymnastics Club",
    "Infinito Arena",
    "Siddhant's Badminton Academy",
    "MPP Sports Park",
    "Dwarkadhish Gymnastics Club"
  ];

  useEffect(() => {
    if (managerData?.stadiumID) {
      fetchCourtCount();
    }
  }, [managerData?.stadiumID]);

  const fetchCourtCount = async () => {
    try {
      const courtsRef = collection(db, 'courts');
      const q = query(courtsRef, where('stadiumId', '==', managerData.stadiumID));
      const querySnapshot = await getDocs(q);
      setCourtCount(querySnapshot.size);
    } catch (error) {
      console.error('Error fetching court count:', error);
    }
  };

  const cards = [
    {
      title: "Profile",
      icon: Pencil,
      color: "bg-blue-500",
      customContent: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="text-gray-600" size={18} />
            <span className="text-sm text-gray-600">{stadiumData?.address || 'No address'}</span>
          </div>
          {stadiumData?.addressLink && (
            <div className="flex items-center gap-2">
              <Link className="text-gray-600" size={18} />
              <a 
                href={stadiumData.addressLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View on Map
              </a>
            </div>
          )}
          {stadiumData?.amenities && stadiumData.amenities.length > 0 && (
            <div className="flex items-start gap-2">
              <List className="text-gray-600 mt-1" size={18} />
              <div className="flex flex-wrap gap-2">
                {stadiumData.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      title: "Users List",
      icon: Users,
      count: "1,234",
      description: "Total registered users",
      color: "bg-blue-500",
      onClick: () => setIsUsersListModalOpen(true)
    },
    {
      title: "Expiries/Bookings",
      icon: CreditCard,
      count: "Recent",
      description: "View expiring & recent bookings",
      color: "bg-green-500",
      onClick: () => setIsExpiryBookingsModalOpen(true)
    },
    {
      title: "Coaches",
      icon: UserCheck,
      count: "42",
      description: "Active coaches",
      color: "bg-purple-500",
      onClick: () => setIsCoachesModalOpen(true)
    },
    {
      title: "Court Details",
      icon: Calendar,
      count: courtCount.toString(),
      description: "Available courts",
      color: "bg-yellow-500",
      onClick: () => setIsCourtListModalOpen(true)
    },
    {
      title: "Revenue",
      icon: BarChart3,
      count: "$45,678",
      description: "Total revenue",
      color: "bg-red-500",
    },
  ]

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="flex justify-end mb-6">
        <div className="relative w-64">
          <select
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e.target.value)}
            className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Venue</option>
            {venues.map((venue, index) => (
              <option key={index} value={venue}>
                {venue}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div 
            key={index} 
            className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
              card.onClick ? 'cursor-pointer' : ''
            }`}
            onClick={card.onClick}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{card.title}</h3>
                <div 
                  className={`p-3 rounded-full ${card.color} text-white ${
                    card.onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (card.title === "Profile") {
                      setIsEditModalOpen(true);
                    }
                  }}
                >
                  <card.icon size={24} />
                </div>
              </div>
              {card.customContent ? (
                card.customContent
              ) : (
                <div>
                  <p className="text-2xl font-bold">{card.count}</p>
                  <p className="text-gray-500 text-sm">{card.description}</p>
                </div>
              )}
            </div>
            <div className={`h-1 ${card.color}`}></div>
          </div>
        ))}
      </div>

      <EditStadiumModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />

      <CourtListModal
        isOpen={isCourtListModalOpen}
        onClose={() => setIsCourtListModalOpen(false)}
        stadiumId={managerData?.stadiumID}
      />

      <UsersListModal
        isOpen={isUsersListModalOpen}
        onClose={() => setIsUsersListModalOpen(false)}
      />

      <ExpiryBookingsModal
        isOpen={isExpiryBookingsModalOpen}
        onClose={() => setIsExpiryBookingsModalOpen(false)}
      />

      <CoachesModal
        isOpen={isCoachesModalOpen}
        onClose={() => setIsCoachesModalOpen(false)}
        stadiumId={managerData?.stadiumID}
      />
    </main>
  )
}

export default Dashboard

