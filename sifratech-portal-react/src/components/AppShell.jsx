import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';

export default function AppShell() {
  return (
    <div id="appShell" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar />
      <div className="main" style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
