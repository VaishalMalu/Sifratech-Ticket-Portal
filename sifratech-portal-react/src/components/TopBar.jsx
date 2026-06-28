import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { IconChartBar, IconTicket, IconUsers, IconSettings, IconLogout } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export default function TopBar() {
  const { currentUser, logout, switchRole } = useAuth();
  const { getActiveClient } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const client = getActiveClient();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
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
        <button className="btn-s" onClick={handleLogout} title="Sign out">
          <IconLogout size={16} />
        </button>
      </div>
    </div>
  );
}
