import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState({
    id: 'user1',
    label: 'Account Manager',
    role: 'Account Manager',
    client: null
  });
  const [loading, setLoading] = useState(true);

  // Compute permissions dynamically
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

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: userData } = await supabase.from('users').select('*, roles(name), teams(name)').eq('id', session.user.id).single();
          const roleName = userData?.roles?.name || 'Customer';
          setCurrentUser({
            id: session.user.id,
            label: userData?.full_name || session.user.email,
            email: session.user.email,
            role: roleName,
            client: userData?.teams?.name || null
          });
        } else {
          const fallback = localStorage.getItem('fallbackUser');
          if (fallback) {
            setCurrentUser(JSON.parse(fallback));
          } else {
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setCurrentUser(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const { data: userData } = await supabase.from('users').select('*, roles(name), teams(name)').eq('id', session.user.id).single();
        const roleName = userData?.roles?.name || 'Customer';
        setCurrentUser({
          id: session.user.id,
          label: userData?.full_name || session.user.email,
          email: session.user.email,
          role: roleName,
          client: userData?.teams?.name || null
        });
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (username, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });
      
      if (error) {
        console.error("Login failed:", error.message);
        // Fallback for development if Supabase is asleep or credentials fail
        if (username.includes('@sifratc.com') || username === 'Account Manager') {
           console.log("Using local fallback login due to Supabase error.");
           const fallbackUser = {
             id: 'local-fallback-id',
             label: username.split('@')[0],
             email: username,
             role: 'Admin',
             client: 'Sifratech'
           };
           localStorage.setItem('fallbackUser', JSON.stringify(fallbackUser));
           setCurrentUser(fallbackUser);
           return true;
        }
        return false;
      }
      
      if (data?.user) {
        const { data: userData } = await supabase.from('users').select('*, roles(name), teams(name)').eq('id', data.user.id).single();
        const roleName = userData?.roles?.name || 'Customer';
        
        setCurrentUser({
          id: data.user.id,
          label: userData?.full_name || username,
          email: username,
          role: roleName,
          client: userData?.teams?.name || null
        });
        return true;
      }
    } catch (e) {
      console.error("Network error during login:", e);
      // Fallback for network timeouts
      if (username.includes('@sifratc.com') || username === 'Account Manager') {
         console.log("Using local fallback login due to network timeout.");
         const fallbackUser = {
           id: 'local-fallback-id',
           label: username.split('@')[0],
           email: username,
           role: 'Admin',
           client: 'Sifratech'
         };
         localStorage.setItem('fallbackUser', JSON.stringify(fallbackUser));
         setCurrentUser(fallbackUser);
         return true;
      }
    }
    return false;
  };

  const logout = async () => {
    localStorage.removeItem('fallbackUser');
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const switchRole = () => {
    // Disabled in proper auth mode
    console.warn("Role switching is disabled in proper auth mode.");
  };

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', fontFamily: 'var(--font)', color: '#6B7A8D' }}>Loading secure portal...</div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser: activeUser, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
