import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGate() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter username and password.');
      return;
    }
    
    const success = await login(username, password);
    if (success) {
      navigate('/dashboard');
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
        <div className="auth-field">
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button className="auth-btn" onClick={handleLogin}>Sign in</button>
        <div className="auth-err">{error}</div>
        <div className="auth-copy">© 2025 Sifratech Technology Pvt Ltd · All rights reserved · Proprietary & Confidential</div>
      </div>
    </div>
  );
}
