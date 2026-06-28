import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ROLES, DEMO_CREDS } from '../data/mockData';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sifratech_auth');
    return saved ? JSON.parse(saved) : null;
  });

  // Compute permissions dynamically so they aren't stuck in localStorage
  const activeUser = React.useMemo(() => {
    if (!currentUser) return null;
    const roleName = currentUser.role || 'Customer';
    
    const generatedInitials = currentUser.initials || (currentUser.label ? currentUser.label.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??');

    return {
      ...currentUser,
      initials: generatedInitials,
      isAdmin: roleName === 'Admin' || roleName === 'Account Manager' || roleName === 'Delivery Manager' || roleName === 'Manager',
      isSupport: roleName !== 'Customer' && roleName !== 'Client',
      canCreate: true,
      canAssign: roleName === 'Admin' || roleName === 'Manager' || roleName === 'Delivery Manager' || roleName === 'Account Manager',
      canClose: roleName !== 'Customer' && roleName !== 'Client',
      seeAll: roleName === 'Admin' || roleName === 'Account Manager' || roleName === 'Delivery Manager' || roleName === 'Manager'
    };
  }, [currentUser]);

  const login = async (username, password) => {
    // 1. Try Live Supabase Authentication first
    if (username.includes('@')) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });
      if (data?.user) {
        // Fetch public profile and role
        const { data: userData } = await supabase.from('users').select('*, roles(name), teams(name)').eq('id', data.user.id).single();
        const roleName = userData?.roles?.name || 'Customer';
        
        const userObj = {
          id: data.user.id,
          label: userData?.full_name || username,
          email: username,
          role: roleName,
          client: userData?.teams?.name || null
        };
        setCurrentUser(userObj);
        localStorage.setItem('sifratech_auth', JSON.stringify(userObj));
        return true;
      }
    }

    // 2. Fallback to Demo Credentials
    const u = username.trim().toLowerCase().replace(/\s+/g, '_');
    const cred = DEMO_CREDS.find(c => c.user === u && c.pass === password);
    if (cred) {
      let roleKey = 'am';
      if (u.includes('client')) roleKey = 'client1';
      else if (u === 'support_venkat') roleKey = 'support_venkat';
      else if (u === 'admin_dhaya') roleKey = 'admin_dhaya';
      else if (u.includes('support')) roleKey = 'support_venkat';
      
      const user = { ...ROLES[roleKey], roleKey };
      setCurrentUser(user);
      localStorage.setItem('sifratech_auth', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('sifratech_auth');
  };

  // Allows switching roles for demo purposes without logging out
  const switchRole = (roleKey) => {
    const user = { ...ROLES[roleKey], roleKey };
    setCurrentUser(user);
    localStorage.setItem('sifratech_auth', JSON.stringify(user));
  };

  return (
    <AuthContext.Provider value={{ currentUser: activeUser, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
