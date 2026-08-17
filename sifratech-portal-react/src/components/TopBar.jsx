import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { IconChartBar, IconTicket, IconUsers, IconSettings, IconLogout, IconShieldLock } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export default function TopBar() {
  const { currentUser, logout, switchRole, updatePassword } = useAuth();
  const { getActiveClient } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const client = getActiveClient();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordErr('Password must be at least 6 characters.');
      return;
    }
    setPasswordErr('');
    setPasswordMsg('');
    const { success, error } = await updatePassword(newPassword);
    if (success) {
      setPasswordMsg('Password updated successfully!');
      setTimeout(() => setShowPasswordModal(false), 2000);
    } else {
      setPasswordErr(error || 'Failed to update password.');
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="tb-left">
          <div className="sifra-logo">
            <svg width="30" height="30" viewBox="0 0 44 44" fill="none">
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
            </svg>
            <div className="sifra-wordmark">
              <div className="w1">SIFRA<span>TECH</span></div>
              <div className="w2">A Alt-S Group Company</div>
            </div>
          </div>
          <div className="client-pill">
            <span className="client-lbl">Client</span>
            {client?.logoUrl ? (
              <img className="client-img" src={client.logoUrl} alt="Client" />
            ) : (
              <span className="client-txt">{client?.name || 'Sifratech'}</span>
            )}
          </div>
        </div>
        <div className="tb-center">
          <div className="nav">
            <button onClick={() => navigate('/dashboard')} className={location.pathname.includes('dashboard') ? 'active' : ''}>
              <IconChartBar size={16} /> Dashboard
            </button>
            <button onClick={() => navigate('/tickets')} className={location.pathname.includes('tickets') ? 'active' : ''}>
              <IconTicket size={16} /> Tickets
            </button>
            {currentUser?.isAdmin && (
              <>
                <button onClick={() => navigate('/team')} className={location.pathname.includes('team') ? 'active' : ''}>
                  <IconUsers size={16} /> Team
                </button>
                <button onClick={() => navigate('/settings')} className={location.pathname.includes('settings') ? 'active' : ''}>
                  <IconSettings size={16} /> Settings
                </button>
              </>
            )}
          </div>
        </div>
        <div className="tb-right">
          <div className="avatar">{currentUser?.initials || '??'}</div>
          <button className="btn-s" onClick={() => { setShowPasswordModal(true); setNewPassword(''); setPasswordMsg(''); setPasswordErr(''); setShowNewPassword(false); }} title="Change Password" style={{ marginRight: '8px' }}>
            <IconShieldLock size={16} />
          </button>
          <button className="btn-s" onClick={handleLogout} title="Sign out">
            <IconLogout size={16} />
          </button>
        </div>
      </div>

      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Change Password</h3>
            <div className="fg">
              <div className="fl full" style={{ position: 'relative' }}>
                <label>New Password</label>
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '38px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6B7A8D',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? (
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
              {passwordErr && <div style={{ color: '#e53935', fontSize: '13px', marginTop: '10px' }}>{passwordErr}</div>}
              {passwordMsg && <div style={{ color: '#4caf50', fontSize: '13px', marginTop: '10px' }}>{passwordMsg}</div>}
              <div className="full form-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-s" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="button" className="btn-p" onClick={handleUpdatePassword}>Update</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
