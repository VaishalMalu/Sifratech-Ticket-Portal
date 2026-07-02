import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGate() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter username and password.');
      return;
    }
    
    const success = await login(username, password);
    if (success) {
      let from = '/dashboard';
      if (location.state && location.state.from) {
         from = location.state.from.pathname + (location.state.from.search || '');
      }
      navigate(from);
    } else {
      setError('Invalid username or password.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div id="authGate" style={{ display: 'flex' }}>
      <div className="auth-box">
        <div className="auth-logo">
          <svg viewBox="0 0 44 44" fill="none">
            <circle cx="22" cy="10" r="3.5" fill="#1A9FCC"/>
            <circle cx="8" cy="22" r="2.8" fill="#1A9FCC" opacity=".7"/>
            <circle cx="36" cy="22" r="2.8" fill="#1A9FCC" opacity=".7"/>
            <circle cx="13" cy="34" r="2.5" fill="#35C8E8" opacity=".6"/>
            <circle cx="31" cy="34" r="2.5" fill="#35C8E8" opacity=".6"/>
            <circle cx="22" cy="26" r="3.5" fill="#1A9FCC"/>
            <line x1="22" y1="10" x2="8" y2="22" stroke="#1A9FCC" strokeWidth="1.2" opacity=".5"/>
            <line x1="22" y1="10" x2="36" y2="22" stroke="#1A9FCC" strokeWidth="1.2" opacity=".5"/>
            <line x1="8" y1="22" x2="22" y2="26" stroke="#1A9FCC" strokeWidth="1.2" opacity=".5"/>
            <line x1="36" y1="22" x2="22" y2="26" stroke="#1A9FCC" strokeWidth="1.2" opacity=".5"/>
            <line x1="22" y1="26" x2="13" y2="34" stroke="#35C8E8" strokeWidth="1.2" opacity=".4"/>
            <line x1="22" y1="26" x2="31" y2="34" stroke="#35C8E8" strokeWidth="1.2" opacity=".4"/>
            <line x1="8" y1="22" x2="13" y2="34" stroke="#35C8E8" strokeWidth="1" opacity=".3"/>
            <line x1="36" y1="22" x2="31" y2="34" stroke="#35C8E8" strokeWidth="1" opacity=".3"/>
          </svg>
          <div className="auth-wordmark">
            <div className="w1">SIFRA<span>TECH</span></div>
            <div className="w2">A Alt-S Group Company</div>
          </div>
        </div>
        <div className="auth-title">Support Portal — Authorised Access Only</div>
        <div className="auth-field">
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off" 
          />
        </div>
        <div className="auth-field" style={{ position: 'relative' }}>
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ paddingRight: '40px' }}
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.5)',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        </div>
        <button className="auth-btn" onClick={handleLogin}>Sign in</button>
        <div className="auth-err">{error}</div>
        <div className="auth-copy">© 2025 Sifratech Technology Pvt Ltd · All rights reserved · Proprietary & Confidential</div>
      </div>
    </div>
  );
}
