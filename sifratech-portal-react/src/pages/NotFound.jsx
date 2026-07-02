import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '500px', textAlign: 'center' }}>
        <h1 style={{ color: '#0f172a', fontSize: '48px', margin: '0 0 16px 0' }}>404</h1>
        <h2 style={{ color: '#334155', marginTop: 0 }}>Page Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>
          We can't seem to find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ padding: '12px 24px', backgroundColor: '#1A5FA8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', transition: 'background-color 0.2s' }}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
