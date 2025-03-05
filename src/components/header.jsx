import { LogOut, Menu, User } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useState } from "react"

const Header = ({ toggleSidebar }) => {
  const { logOut, managerData, stadiumData } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setError('');
      await logOut();
    } catch (error) {
      setError('Failed to log out. Please try again.');
      console.error('Failed to log out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4">
      <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-100 lg:hidden">
        <Menu size={20} />
      </button>

      <div className="flex-1 lg:ml-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {stadiumData?.name || 'Loading Stadium...'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
        <div className="flex items-center gap-2">
          <User size={18} className="text-gray-600" />
          <span className="text-gray-700 font-medium">
            Welcome, {managerData?.name || 'Loading...'}
          </span>
        </div>
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            isLoggingOut 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          <LogOut size={18} />
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </header>
  )
}

export default Header

