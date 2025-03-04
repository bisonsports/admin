import { Users, CreditCard, UserCheck, Calendar, BarChart3, ChevronLeft, ChevronRight } from "lucide-react"

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navItems = [
    { title: "Users List", icon: Users },
    { title: "Payment History", icon: CreditCard },
    { title: "Coaches", icon: UserCheck },
    { title: "Court Details", icon: Calendar },
    { title: "Revenue", icon: BarChart3 },
  ]

  return (
    <div className={`bg-white h-full shadow-lg transition-all duration-300 ${isOpen ? "w-64" : "w-20"} relative`}>
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className={`font-bold text-xl ${!isOpen && "hidden"}`}>SportsDash</h1>
        <button onClick={toggleSidebar} className="p-1 rounded-full hover:bg-gray-200">
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="mt-6">
        <ul>
          {navItems.map((item, index) => (
            <li key={index}>
              <a href="#" className="flex items-center p-4 text-gray-700 hover:bg-gray-100 transition-colors">
                <item.icon size={20} className="min-w-[20px]" />
                <span className={`ml-4 ${!isOpen && "hidden"}`}>{item.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar

