import { Users, CreditCard, UserCheck, Calendar, BarChart3 } from "lucide-react"

const Dashboard = () => {
  const cards = [
    {
      title: "Users List",
      icon: Users,
      count: "1,234",
      description: "Total registered users",
      color: "bg-blue-500",
    },
    {
      title: "Payment History",
      icon: CreditCard,
      count: "$12,345",
      description: "Total transactions",
      color: "bg-green-500",
    },
    {
      title: "Coaches",
      icon: UserCheck,
      count: "42",
      description: "Active coaches",
      color: "bg-purple-500",
    },
    {
      title: "Court Details",
      icon: Calendar,
      count: "8",
      description: "Available courts",
      color: "bg-yellow-500",
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{card.title}</h3>
                <div className={`p-3 rounded-full ${card.color} text-white`}>
                  <card.icon size={24} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold">{card.count}</p>
                <p className="text-gray-500 text-sm">{card.description}</p>
              </div>
            </div>
            <div className={`h-1 ${card.color}`}></div>
          </div>
        ))}
      </div>
    </main>
  )
}

export default Dashboard

