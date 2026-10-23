import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // FIX: Initialize as null, NOT a hardcoded fake user.
  // The old code had { id: 'user1', label: 'Account Manager', ... } which caused
  // ProtectedRoute to bypass login when fetchSession errored out.
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch user profile from public.users table
  const fetchUserProfile = useCallback(async (session) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*, roles(name), teams(name)')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.warn("Failed to fetch user profile from public.users:", error.message);
        // Still allow login even if profile fetch fails - use email as fallback
      }
      
      const roleName = userData?.roles?.name || 'Customer';
      return {
        id: session.user.id,
        label: userData?.full_name || session.user.email,
        email: session.user.email,
        role: roleName,
        client: userData?.teams?.name || null
      };
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Fallback: return minimal user from session
      return {
        id: session.user.id,
        label: session.user.email,
        email: session.user.email,
        role: 'Customer',
        client: null
      };
    }
  }, []);

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
      canAssign: roleName === 'Admin' || roleName === 'Manager' || roleName === 'Delivery Manager' || roleName === 'Account Manager' || roleName === 'Technical Team' || roleName === 'Support' || roleName === 'Support Engineer' || roleName === 'Engineer' || currentUser.label?.toLowerCase().includes('technical team'),
      canClose: roleName !== 'Customer' && roleName !== 'Client',
      seeAll: roleName === 'Admin' || roleName === 'Account Manager' || roleName === 'Delivery Manager' || roleName === 'Manager' || roleName === 'Engineer' || roleName === 'Technical Team' || currentUser.label?.toLowerCase().includes('technical team')
    };
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session fetch error:", sessionError.message);
          if (isMounted) setCurrentUser(null);
          return;
        }
        
        if (session) {
          const userProfile = await fetchUserProfile(session);
          if (isMounted) setCurrentUser(userProfile);
        } else {
          if (isMounted) setCurrentUser(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        // FIX: On ANY error, explicitly set null so ProtectedRoute redirects to login
        if (isMounted) setCurrentUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSession();

    // Safety timeout: if fetchSession takes too long (e.g. Render cold start),
    // stop loading after 10s so user at least sees the login page
    const loadingTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("Auth loading timeout — forcing load complete");
        setLoading(false);
      }
    }, 10000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_OUT' || !session) {
        setCurrentUser(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          const userProfile = await fetchUserProfile(session);
          if (isMounted) setCurrentUser(userProfile);
        } catch (err) {
          console.error("Error in auth state change handler:", err);
          // Don't null out user on TOKEN_REFRESHED errors — keep existing session
          if (event === 'SIGNED_IN' && isMounted) setCurrentUser(null);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = async (username, password) => {
    try {
      const cleanUsername = (username || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanUsername,
        password: cleanPassword,
      });
      
      if (error) {
        console.error("Login failed:", error.message);
        return { success: false, error: error.message };
      }
      
      if (data?.user && data?.session) {
        const userProfile = await fetchUserProfile(data.session);
        setCurrentUser(userProfile);
        return { success: true };
      }
    } catch (e) {
      console.error("Network error during login:", e);
      return { success: false, error: e.message || 'Network error during login' };
    }
    return { success: false, error: 'Authentication failed.' };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error during sign out:", err);
    } finally {
      // Always clear user state, even if signOut API call fails
      setCurrentUser(null);
    }
  };

  const switchRole = () => {
    // Disabled in proper auth mode
    console.warn("Role switching is disabled in proper auth mode.");
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/settings', // Or a dedicated reset page
      });
      if (error) {
        console.error("Reset password error:", error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e) {
      console.error("Network error during password reset:", e);
      return { success: false, error: e.message };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error("Update password error:", error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e) {
      console.error("Network error during password update:", e);
      return { success: false, error: e.message };
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', fontFamily: 'var(--font)', color: '#6B7A8D' }}>Loading secure portal...</div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser: activeUser, login, logout, switchRole, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

