"use client"

import { useState } from "react"
import Sidebar from "./components/sidebar"
import Header from "./components/header"
import Dashboard from "./components/dashboard"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import LoginModal from "./components/LoginModal"

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { user } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  if (!user) {
    return <LoginModal />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        <Dashboard />
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

