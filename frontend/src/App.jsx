import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Layout
import Layout from './components/layout/Layout';

// Import Pages
import Dashboard from './pages/Dashboard'; 
import TreeInventory from './pages/TreeInventory';
import MapView from './pages/MapView';
import Analytics from './pages/Analytics';
import Enterprises from './pages/Enterprises';
import Login from './pages/Login';
import Settings from './pages/Settings';

// --- PROTECTED ROUTE COMPONENT ---
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // If no token, redirect to the root (Login) page
    return <Navigate to="/" replace />;
  }
  
  // If token exists, allow access
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* 1. PUBLIC ROUTE: The Root Path "/" is now explicitly the Login Page */}
        <Route path="/" element={<Login />} />

        {/* 2. PROTECTED ROUTES: Wrapped in Layout AND ProtectedRoute */}
        <Route 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard is moved to its own path '/dashboard' */}
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="inventory" element={<TreeInventory />} />
          <Route path="map" element={<MapView />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="enterprises" element={<Enterprises />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 3. CATCH-ALL: Redirect unknown URLs back to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;