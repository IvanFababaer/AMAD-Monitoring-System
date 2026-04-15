// @refresh reset
import React, { createContext, useState, useEffect } from 'react';

// 1. IMPORT THE IMAGE DIRECTLY (Make sure this path is correct!)
import defaultLogo from '../assets/logo.jpg'; 

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 1. Load System Logo
  const [logo, setLogo] = useState(() => {
    const savedLogo = localStorage.getItem('appLogo');
    
    // Reject broken data and use our imported logo.jpg
    if (
      !savedLogo || 
      savedLogo === 'null' || 
      savedLogo === 'undefined' || 
      savedLogo === '[object Object]'
    ) {
      return defaultLogo; 
    }
    
    return savedLogo;
  });

  // 2. Load System Name (Nomenclature)
  const [systemName, setSystemName] = useState(() => {
    const savedName = localStorage.getItem('systemName');
    if (!savedName || savedName === 'null' || savedName === 'undefined') {
      return 'AMAD System';
    }
    return savedName;
  });

  // 3. Load Admin Profile
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('appProfile');
      return saved ? JSON.parse(saved) : { 
        name: 'Arvin D. Fababaer', 
        role: 'System Administrator', 
        email: 'admin@agritreetracker.com',
        photo: null 
      };
    } catch (e) {
      return { 
        name: 'Arvin D. Fababaer', 
        role: 'System Administrator', 
        email: 'admin@agritreetracker.com',
        photo: null 
      };
    }
  });

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('appLogo', logo);
  }, [logo]);

  useEffect(() => {
    localStorage.setItem('systemName', systemName);
  }, [systemName]);

  useEffect(() => {
    localStorage.setItem('appProfile', JSON.stringify(profile));
  }, [profile]);

  return (
    <ThemeContext.Provider value={{ 
      logo, setLogo, 
      systemName, setSystemName, 
      profile, setProfile 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};