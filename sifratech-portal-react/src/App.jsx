import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ModalProvider } from './contexts/ModalContext';
import ModalManager from './components/ModalManager';
import './index.css';

// Lazy loading pages for better performance (optional, but good practice)
import AuthGate from './pages/AuthGate';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Team from './pages/Team';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';

// A simple protected route component
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// Account Manager only route component
function AccountManagerRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const isAM = currentUser?.role?.trim()?.toLowerCase() === 'account manager' || 
               currentUser?.email?.toLowerCase() === 'account_manager@sifratc.com' ||
               currentUser?.email?.toLowerCase() === 'account_manager@sifratech.com';

  if (!isAM) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ModalProvider>
          <Router>
            <Routes>
            <Route path="/login" element={<AuthGate />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tickets" element={<Tickets />} />
              <Route path="reports" element={
                <AccountManagerRoute>
                  <Reports />
                </AccountManagerRoute>
              } />
              <Route path="team" element={<Team />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* 404 Fallback Route */}
            <Route path="*" element={<NotFound />} />
            
          </Routes>
        </Router>
        <ModalManager />
        <Toaster position="bottom-right" />
        </ModalProvider>
      </DataProvider>
    </AuthProvider>
  );
}
