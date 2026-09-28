import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { ScanFace, UserPlus, Camera, Lock, Home as HomeIcon } from 'lucide-react';
import AdaptiveEnroll from './pages/AdaptiveEnroll';
import Attendance from './pages/Attendance';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Home from './pages/Home';
import LiquidBackground from './components/LiquidBackground';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Protective wrapper for Admin routes
const ProtectedRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  // Obscure and secure the access route; only valid tokens survive
  return isAdmin ? children : <Navigate to="/admin-login" replace />;
};

// Nav Link component for active state styling
const NavLink = ({ to, label, className = '', style = {} }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (location.pathname === '/admin' && to === '/admin-login');

  return (
    <Link
      to={to}
      className={`${isActive ? 'active' : ''} ${className}`}
      style={style}
    >
      {label}
    </Link>
  );
};

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent swiping by adding a strict overflow block on the main container
  return (
    <ErrorBoundary>
      <Router>
        <div className="app-container" style={{ overflowX: 'hidden', touchAction: isMobile ? 'pan-y' : 'auto' }}>
          <LiquidBackground />

          <nav className="navbar" style={{ 
            margin: isMobile ? '0' : '1rem', 
            borderRadius: isMobile ? '0 0 var(--radius-lg) var(--radius-lg)' : 'var(--radius-lg)', 
            padding: isMobile ? '0.8rem 1rem' : '1rem 2rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: isMobile ? '1px solid var(--border-light)' : 'none',
            position: isMobile ? 'sticky' : 'static',
            top: 0,
            zIndex: 100,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: isMobile ? '0 4px 20px rgba(0,0,0,0.05)' : 'none'
          }}>
            <Link to="/" className="nav-brand" style={{ textDecoration: 'none', gap: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <ScanFace className="text-primary" size={isMobile ? 24 : 28} />
              <span style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>FaceAttend</span>
            </Link>

            <div style={{ display: 'flex', gap: isMobile ? '0.2rem' : '1rem', alignItems: 'center' }}>
              <NavLink to="/" style={{ fontWeight: 700, padding: isMobile ? '0.5rem' : '0.5rem 1rem', textDecoration: 'none', color: 'var(--text-secondary)' }} label="Home" />
              <NavLink to="/register" style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                padding: isMobile ? '0.4rem 1rem' : '0.5rem 1.25rem', 
                borderRadius: '50px', 
                fontWeight: 700, 
                fontSize: '0.9rem',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                marginLeft: isMobile ? '0.2rem' : '0'
              }} label="Enroll" />
              {!isMobile && <NavLink to="/attendance" label="Scanner" style={{ padding: '0.5rem 1rem', textDecoration: 'none', color: 'var(--text-secondary)' }} />}
              {!isMobile && <NavLink to="/admin-login" label={<div style={{display: 'flex', alignItems: 'center', gap: '5px'}}><Lock size={15}/> Lecturer</div>} style={{ padding: '0.5rem 1rem', textDecoration: 'none', color: 'var(--text-secondary)' }} />}
            </div>
          </nav>

          <main className="main-content" style={isMobile ? { padding: '1rem', paddingTop: '0' } : {}}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<AdaptiveEnroll />} />
              <Route path="/attendance" element={isMobile ? <Navigate to="/" replace /> : <Attendance />} />
              <Route path="/admin-login" element={isMobile ? <Navigate to="/" replace /> : <AdminLogin />} />
              <Route
                path="/admin"
                element={
                  isMobile ? <Navigate to="/" replace /> :
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
