import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// A simple protected route component
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
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
              <Route path="team" element={<Team />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
          </Routes>
        </Router>
        <ModalManager />
        <Toaster position="bottom-right" />
        </ModalProvider>
      </DataProvider>
    </AuthProvider>
  );
}
