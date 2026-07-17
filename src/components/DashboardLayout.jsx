import React, { useState, useEffect, useRef } from "react";
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
  Compass,
  Bell,
  Search,
  ChevronRight,
  Terminal,
  Settings,
  HelpCircle
} from "lucide-react";
import { styles } from "../styles";
import { motion, AnimatePresence } from "framer-motion";

const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const location = useLocation();
  const navigate = useNavigate();

  // Refs for closing dropdowns on click outside
  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  const handleLogoutClick = async () => {
    const success = await logout();
    if (success) {
      navigate("/");
    }
  };

  // Keyboard shortcut Ctrl + K / Cmd + K to toggle command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { name: "Overview", path: "/dashboard", icon: Home },
    { name: "Quizzes", path: "/dashboard/quizzes", icon: BookOpen },
    { name: "Leaderboard", path: "/dashboard/leaderboard", icon: Trophy },
    { name: "Certificates", path: "/dashboard/certificates", icon: Award },
    { name: "Profile", path: "/dashboard/profile", icon: User },
  ];

  if (!currentUser) {
    return null;
  }

  // Get breadcrumb parts
  const getBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold select-none">
        <span>App</span>
        <ChevronRight className="w-3 h-3 text-gray-600" />
        {paths.map((p, idx) => {
          const isLast = idx === paths.length - 1;
          const label = p.charAt(0).toUpperCase() + p.slice(1);
          return (
            <React.Fragment key={p}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-gray-600" />}
              <span className={isLast ? "text-gray-300 font-bold" : ""}>{label}</span>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Mock Notification Feed
  const notifications = [
    { id: 1, text: "🏆 JavaScript Expert Badge earned successfully!", date: "2h ago" },
    { id: 2, text: "⚡ Assessment Run record updated on Leaderboard.", date: "1d ago" },
    { id: 3, text: "✨ Verification Code ready for your certificate.", date: "2d ago" }
  ];

  // Command Palette Items
  const paletteCommands = [
    { name: "Go to Overview Dashboard", path: "/dashboard", description: "Stats summary & streak" },
    { name: "Configure & Start Quiz", path: "/dashboard/quizzes", description: "Select category & difficulty" },
    { name: "View Global Leaderboard", path: "/dashboard/leaderboard", description: "Check top submissions" },
    { name: "Generate & Verify Certificates", path: "/dashboard/certificates", description: "Claim badges" },
    { name: "Manage Profile Settings", path: "/dashboard/profile", description: "Display name & email" },
  ];

  const filteredCommands = paletteCommands.filter((cmd) =>
    cmd.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`h-screen w-screen overflow-hidden ${styles.bgMain} text-white flex flex-row relative font-sans`}>
      <AnimatePresence>
        {/* COMMAND PALETTE MODAL (Ctrl + K) */}
        {commandPaletteOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0d0d1e]/85 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4"
            onClick={() => setCommandPaletteOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.98, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: -10 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#1a1a2e] w-full max-w-xl rounded-2xl border border-[#2a2a40] shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Palette Input bar */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#2a2a40]">
                <Terminal className="w-4 h-4 text-[#915EFF]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type a command or page to navigate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-white border-none outline-none text-sm w-full placeholder:text-gray-600"
                  autoFocus
                />
                <span className="text-[10px] text-gray-500 bg-[#202038] px-2 py-0.5 rounded border border-[#2a2a40] uppercase">ESC</span>
              </div>

              {/* Commands List */}
              <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 no-scrollbar">
                {filteredCommands.length === 0 ? (
                  <p className="text-gray-500 text-xs py-6 text-center">No commands match your query.</p>
                ) : (
                  filteredCommands.map((cmd) => (
                    <button
                      key={cmd.path}
                      onClick={() => {
                        navigate(cmd.path);
                        setCommandPaletteOpen(false);
                        setSearchQuery("");
                      }}
                      className="w-full text-left p-3 hover:bg-[#202038]/50 rounded-xl flex items-center justify-between group transition duration-150 border-none bg-transparent cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white group-hover:text-[#a27eff] transition duration-150">{cmd.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{cmd.description}</p>
                      </div>
                      <span className="text-[10px] text-[#915EFF] font-bold opacity-0 group-hover:opacity-100 transition duration-150">Jump ↩</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR (Desktop) */}
      <aside className={`hidden md:flex flex-col w-64 ${styles.bgCard} border-r border-[#2a2a40] shrink-0 p-6 justify-between h-screen overflow-y-auto no-scrollbar select-none z-10`}>
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
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm relative transition duration-150 ${
                    isActive 
                      ? "text-white" 
                      : "text-gray-400 hover:text-white hover:bg-[#202038]/40"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarPill"
                      className="absolute inset-0 bg-[#915EFF] rounded-xl z-0 shadow-md shadow-[#915EFF]/15"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4.5 h-4.5 z-10" />
                  <span className="z-10">{item.name}</span>
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
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm relative transition duration-150 ${
                    isActive 
                      ? "text-white" 
                      : "text-gray-400 hover:text-white hover:bg-[#202038]/40"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarPillMobile"
                      className="absolute inset-0 bg-[#915EFF] rounded-xl z-0 shadow-md shadow-[#915EFF]/15"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4.5 h-4.5 z-10" />
                  <span className="z-10">{item.name}</span>
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
      <div className="flex-1 flex flex-col min-w-0 h-screen relative overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="h-18 border-b border-[#2a2a40] px-6 md:px-8 flex items-center justify-between shrink-0 bg-[#0d0d1e]/85 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger trigger for mobile */}
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden p-1.5 text-gray-400 hover:text-white border-none bg-transparent cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Breadcrumb Info instead of static title */}
            <div className="hidden sm:block">
              {getBreadcrumbs()}
            </div>
          </div>

          {/* Quick Controls & Profile Info */}
          <div className="flex items-center gap-4">
            
            {/* Vercel-like Search trigger button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center justify-between w-48 bg-[#202038]/50 hover:bg-[#2e2e4d]/40 border border-[#2a2a40] hover:border-[#915EFF]/40 rounded-xl px-3 py-1.5 text-xs text-gray-500 transition duration-150 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>Search pages...</span>
              </span>
              <kbd className="text-[9px] font-mono bg-[#1a1a2e] px-1.5 py-0.5 rounded border border-[#2a2a40] text-gray-400 uppercase">⌘K</kbd>
            </button>

            {/* Notification Center Trigger */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="p-2 text-gray-400 hover:text-white bg-[#202038]/50 hover:bg-[#2e2e4d]/40 border border-[#2a2a40] hover:border-[#915EFF]/40 rounded-xl transition duration-150 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {/* Unread dot */}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 mt-2.5 w-72 bg-[#1a1a2e] border border-[#2a2a40] rounded-2xl shadow-xl p-4 space-y-3 z-40 select-none"
                  >
                    <div className="flex justify-between items-center border-b border-[#2a2a40]/60 pb-2">
                      <span className="text-xs font-bold text-white">Notifications Feed</span>
                      <span className="text-[10px] text-gray-500 bg-[#202038] px-2 py-0.5 rounded">3 Updates</span>
                    </div>
                    <div className="divide-y divide-[#2a2a40]/40 max-h-[220px] overflow-y-auto pr-1 space-y-2.5 no-scrollbar">
                      {notifications.map((n) => (
                        <div key={n.id} className="pt-2 text-left space-y-1">
                          <p className="text-xs text-gray-200 leading-normal">{n.text}</p>
                          <span className="text-[9px] text-gray-500 font-medium block">{n.date}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-6 bg-[#2a2a40]" />

            {/* User Profile dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 group active:scale-98 transition duration-150 bg-transparent border-none cursor-pointer"
              >
                <img
                  src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.displayName || 'user'}`}
                  alt="avatar"
                  className="w-9 h-9 rounded-xl border border-[#915EFF]/40 bg-[#1a1a2e] group-hover:border-[#915EFF] transition duration-150"
                />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 mt-2.5 w-56 bg-[#1a1a2e] border border-[#2a2a40] rounded-2xl shadow-xl p-2.5 space-y-1.5 z-40"
                  >
                    <div className="px-2.5 py-2 text-left border-b border-[#2a2a40]/60">
                      <p className="text-xs font-bold text-white leading-normal truncate">{currentUser.displayName}</p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{currentUser.email}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        navigate("/dashboard/profile");
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-[#202038] flex items-center gap-2 border-none bg-transparent cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Account Settings</span>
                    </button>
                    
                    <button
                      onClick={handleLogoutClick}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 border-none bg-transparent cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* WORKSPACE VIEW PORT */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto no-scrollbar max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
