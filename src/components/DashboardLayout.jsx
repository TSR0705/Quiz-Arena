import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  Home, 
  BookOpen, 
  Trophy, 
  Award, 
  User, 
  LogOut, 
  Menu, 
  X,
  Compass
} from "lucide-react";
import { styles } from "../styles";

const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    const success = await logout();
    if (success) {
      navigate("/");
    }
  };

  const navItems = [
    { name: "Overview", path: "/dashboard", icon: Home },
    { name: "Quizzes", path: "/dashboard/quizzes", icon: BookOpen },
    { name: "Leaderboard", path: "/dashboard/leaderboard", icon: Trophy },
    { name: "Certificates", path: "/dashboard/certificates", icon: Award },
    { name: "Profile", path: "/dashboard/profile", icon: User },
  ];

  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.name : "Dashboard";
  };

  if (!currentUser) {
    // If not loaded yet or not logged in, we will handle in App.jsx routing guard
    return null;
  }

  return (
    <div className={`min-h-screen ${styles.bgMain} text-white flex flex-row relative font-sans`}>
      {/* LEFT SIDEBAR (Desktop) */}
      <aside className={`hidden md:flex flex-col w-64 ${styles.bgCard} border-r border-[#2a2a40] shrink-0 p-6 justify-between z-10`}>
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 active:scale-95 transition duration-150">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#915EFF] to-[#a27eff] flex items-center justify-center font-black text-white text-xl shadow-md shadow-[#915EFF]/20">
              QA
            </div>
            <span className="text-xl font-bold tracking-tight text-white bg-clip-text">
              Quiz<span className="text-[#915EFF]">Arena</span>
            </span>
          </Link>

          {/* Navigation links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition duration-150 ${
                    isActive 
                      ? "bg-[#915EFF] text-white shadow-lg shadow-[#915EFF]/20" 
                      : "text-gray-400 hover:text-white hover:bg-[#202038]"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout at bottom */}
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition duration-150 border-none bg-transparent cursor-pointer text-left w-full"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Logout</span>
        </button>
      </aside>

      {/* MOBILE SIDEBAR MODAL OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* MOBILE SIDEBAR CONTAINER */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 ${styles.bgCard} border-r border-[#2a2a40] p-6 justify-between transform transition-transform duration-300 md:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col gap-8">
          {/* Mobile Logo & Close */}
          <div className="flex justify-between items-center">
            <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#915EFF] to-[#a27eff] flex items-center justify-center font-black text-white text-xl">
                QA
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Quiz<span className="text-[#915EFF]">Arena</span>
              </span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-400 hover:text-white border-none bg-transparent cursor-pointer">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Nav links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition duration-150 ${
                    isActive 
                      ? "bg-[#915EFF] text-white shadow-lg shadow-[#915EFF]/20" 
                      : "text-gray-400 hover:text-white hover:bg-[#202038]"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile Logout */}
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition duration-150 border-none bg-transparent cursor-pointer text-left w-full"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Logout</span>
        </button>
      </aside>

      {/* RIGHT CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative overflow-x-hidden">
        {/* TOP NAVBAR */}
        <header className="h-18 border-b border-[#2a2a40] px-6 md:px-8 flex items-center justify-between shrink-0 sticky top-0 bg-[#0d0d1e]/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger trigger for mobile */}
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden p-1.5 text-gray-400 hover:text-white border-none bg-transparent cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
              {getPageTitle()}
            </h1>
          </div>

          {/* User profile pill */}
          <div className="flex items-center gap-4">
            {/* XP and Level Info */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#915EFF]/15 text-[#915EFF] border border-[#915EFF]/30">
                Lvl {currentUser.currentLevel || 1}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                ✨ {currentUser.totalXp || 0} XP
              </span>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-6 bg-[#2a2a40]" />

            {/* Name and avatar */}
            <Link to="/dashboard/profile" className="flex items-center gap-2.5 group active:scale-98 transition duration-150">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white group-hover:text-[#a27eff] transition duration-150">
                  {currentUser.displayName}
                </p>
                <p className="text-[10px] text-gray-400 tracking-wider uppercase font-medium">
                  {currentUser.role}
                </p>
              </div>
              <img
                src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.displayName || 'user'}`}
                alt="avatar"
                className="w-9 h-9 rounded-xl border border-[#915EFF]/40 bg-[#1a1a2e] group-hover:border-[#915EFF] transition duration-150"
              />
            </Link>
          </div>
        </header>

        {/* WORKSPACE VIEW PORT */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
