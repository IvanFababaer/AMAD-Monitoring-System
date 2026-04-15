import React, { useState, useEffect, useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext'; 

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- FIX: Add logoError state to handle broken images ---
  const [logoError, setLogoError] = useState(false);
  
  // --- USER STATE ---
  const [activeUser, setActiveUser] = useState({
    name: 'System Admin',
    role: 'Admin',
    photo: null
  });
  
  // Pull systemName and logo from Global Context
  const { logo, systemName } = useContext(ThemeContext);
  
  // --- LIVE CLOCK STATE ---
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- EFFECT 1: HANDLE USER DATA & UPDATES ---
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setActiveUser(parsedUser);
        } catch (error) {
          console.error("Failed to parse user data");
        }
      }
    };

    // 1. Load initially
    loadUser();

    // 2. LISTEN for the 'profileUpdated' event (Triggered by Settings page)
    window.addEventListener('profileUpdated', loadUser);
    
    // 3. LISTEN for storage changes (Syncs across tabs)
    window.addEventListener('storage', loadUser);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('profileUpdated', loadUser);
      window.removeEventListener('storage', loadUser);
    };
  }, []); 

  // --- EFFECT 2: LIVE CLOCK ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' }, 
    { name: 'Tree Inventory', path: '/inventory' },
    { name: 'Map View', path: '/map' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Enterprises', path: '/enterprises' },
    { name: 'Settings', path: '/settings' },
  ];

  const isActive = (path) => {
    return location.pathname === path 
      ? 'bg-white/10 text-white font-bold shadow-sm' 
      : 'text-green-100/70 hover:bg-white/5 hover:text-white';
  };

  const handleLogout = () => {
    if(window.confirm("Are you sure you want to securely log out?")) {
      localStorage.removeItem('token'); 
      localStorage.removeItem('user'); 
      navigate('/', { replace: true }); 
    }
  };

  // Helper for Display
  const displayName = activeUser.name || 'System Admin';
  const displayRole = activeUser.role || 'Admin';
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-72 bg-[#062C1B] text-white shadow-2xl z-20 shrink-0">
        <div className="p-8 flex flex-col items-center justify-center border-b border-white/5">
          
          {/* --- FIX: Updated Logo Container with Fallback --- */}
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-2xl overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-300">
            {logo && !logoError ? (
              <img 
                src={logo} 
                alt="System Logo" 
                className="w-full h-full object-cover" 
                onError={() => setLogoError(true)} 
              />
            ) : (
              <span className="text-4xl font-black text-[#062C1B]">
                {systemName ? systemName.charAt(0).toUpperCase() : 'S'}
              </span>
            )}
          </div>
          {/* ----------------------------------------------- */}

          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-green-400 text-center leading-relaxed">
            {systemName}
          </h2>
          <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-1">MIMAROPA Region</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-8 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link 
                  to={item.path} 
                  className={`flex items-center px-6 py-3.5 rounded-2xl text-[13px] uppercase tracking-widest transition-all duration-300 ${isActive(item.path)}`}
                >
                  {location.pathname === item.path && (
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-3 animate-pulse"></span>
                  )}
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-6 border-t border-white/5 text-center">
          <p className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">© {new Date().getFullYear()} AMAD Monitoring System</p>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* --- HEADER --- */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-24 flex items-center justify-between px-10 z-10 shrink-0">
          <div className="flex items-center">
            {/* Live Calendar Widget */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex flex-col items-center justify-center bg-[#062C1B] text-white rounded-xl px-4 py-1 mr-4 shadow-lg shadow-green-900/20">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-80">
                  {currentTime.toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-xl font-black leading-none">
                  {currentTime.getDate()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
                </span>
                <span className="text-sm font-black text-slate-800 tabular-nums">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* DYNAMIC Admin Profile Details */}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-black text-slate-900 leading-none mb-1">{displayName}</div>
              <div className="text-[10px] text-green-600 font-black uppercase tracking-widest">{displayRole}</div>
            </div>
            
            {/* DYNAMIC Profile Photo Container */}
            <div className="relative group">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 border-2 border-white shadow-xl flex items-center justify-center text-green-900 font-black text-lg transition-transform group-hover:scale-105 overflow-hidden">
                {activeUser?.photo ? (
                  <img src={activeUser.photo} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{displayInitial}</span>
                )}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200"></div>
            
            <button 
              onClick={handleLogout} 
              className="group flex items-center gap-2 text-[11px] font-black text-slate-400 hover:text-red-600 uppercase tracking-widest transition-colors"
            >
              <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
              Logout
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full h-full overflow-auto bg-[#F8FAFC] p-10">
          <div className="max-w-7xl mx-auto">
            <Outlet /> 
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;