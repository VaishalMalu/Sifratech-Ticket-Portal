import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { TEAM, SLA, INITIAL_CLIENTS } from '../data/mockData';
import { toast } from 'react-hot-toast';

const DataContext = createContext();

export function DataProvider({ children }) {
  const { currentUser } = useAuth();
  
  const [tickets, setTickets] = useState([]);
  const [clients, setClients] = useState(INITIAL_CLIENTS);

  // Settings State
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [slaConfig, setSlaConfig] = useState([]);
  const [oracleModules, setOracleModules] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    email_config: {},
    branding_config: {},
    ai_config: {}
  });
  const apiFetch = async (url, options = {}) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
  };

  const fetchSettings = async () => {
    try {
      const [u, r, t, c, s, o, i, ss] = await Promise.all([
        supabase.from('users').select('*, roles(name), teams(name)'),
        supabase.from('roles').select('*'),
        supabase.from('teams').select('*'),
        supabase.from('customer_accounts').select('*'),
        supabase.from('sla_configuration').select('*'),
        supabase.from('oracle_modules').select('*'),
        supabase.from('incident_types').select('*'),
        supabase.from('system_settings').select('*')
      ]);

      let finalUsers = u.data || [];
      let finalModules = o.data || [];

      if (finalUsers.length === 0 || finalModules.length === 0) {
         try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/public/lookup`);
            if (res.ok) {
               const lookupData = await res.json();
               if (finalUsers.length === 0) finalUsers = lookupData.users || [];
               if (finalModules.length === 0) finalModules = lookupData.oracle_modules || [];
            }
         } catch (e) {
            console.error("Failed to fetch public lookup in settings:", e);
         }
      }

      if (finalUsers.length > 0) setUsersList(finalUsers);
      if (r.data) setRolesList(r.data);
      if (t.data) setTeamsList(t.data);
      if (c.data) {
        setCustomerAccounts(c.data);
        // Sync to clients state so getActiveClient works globally
        setClients(prev => {
           return c.data.map((dbClient, idx) => {
              const existing = prev.find(p => p.id === dbClient.id);
              return {
                 id: dbClient.id,
                 name: dbClient.company_name,
                 contact: dbClient.contact_email,
                 logoUrl: dbClient.logo_url,
                 active: existing ? existing.active : (idx === 0)
              };
           });
        });
      }
      if (s.data) setSlaConfig(s.data);
      if (finalModules.length > 0) setOracleModules(finalModules);
      if (i.data) setIncidentTypes(i.data);
      if (ss.data) {
        const smap = {};
        ss.data.forEach(x => smap[x.key] = x.value);
        setSystemSettings(smap);
      }
    } catch(err) {
      console.error("Error fetching settings:", err);
    }
  };

  // Fetch Tickets from Supabase
  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          oracle_modules ( name ),
          ticket_comments (*),
          ticket_status_history (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching tickets from Supabase:", error);
        return;
      }

      // Fetch Users to map UUIDs to names
      let userData = [];
      const { data: directUsers, error: userError } = await supabase.from('users').select('id, full_name');
      if (userError) {
         console.error("Error fetching users:", userError);
      }
      userData = directUsers || [];

      // If RLS blocked fetching (e.g. demo anon user), fetch via public backend route
      let backendModules = [];
      if (userData.length === 0) {
         try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/public/lookup`);
            if (res.ok) {
               const lookupData = await res.json();
               userData = lookupData.users || [];
               backendModules = lookupData.oracle_modules || [];
            }
         } catch (e) {
            console.error("Failed to fetch public lookup:", e);
         }
      }

      // Map Supabase schema to the React frontend schema
      const mappedTickets = data.map(t => {
        const assignedUser = userData?.find(u => u.id === t.assigned_to);
        
        let modName = 'Unknown';
        if (t.oracle_modules && t.oracle_modules.name) {
            modName = t.oracle_modules.name;
        } else if (t.oracle_module_id) {
            const mod = backendModules.find(m => m.id === t.oracle_module_id);
            if (mod) modName = mod.name;
        }
        return {
        id: t.id,
        number: t.ticket_number,
        title: t.title,
        status: t.status,
        priority: t.priority,
        client: t.company,
        raisedBy: t.customer_name || t.created_by,
        module: modName,
        type: t.ticket_type,
        requestType: t.request_type,
        severity: t.severity,
        businessImpact: t.business_impact,
        assignedTo: assignedUser ? assignedUser.full_name : 'Unassigned',
        assignedToId: t.assigned_to,
        project: 'ASM Support', // default for now
        environment: 'Production', // default
        createdAt: t.created_at,
        detectedDate: t.created_at, // mapped to created_at
        longDescription: t.description,
        summary: t.title, // alias for title
        email: t.email_address,
        created: t.created_at,
        dueDate: t.due_date,
        resolution: t.resolution_code || '',
        resolutionCode: t.resolution_code,
        resolvedBy: t.resolved_by,
        closedBy: t.closed_by,
        updatedBy: t.updated_by,
        comments: t.ticket_comments ? t.ticket_comments.map(c => {
          let by = 'System';
          let msg = c.comment_text;
          if (msg && msg.startsWith('[')) {
             const cb = msg.indexOf(']');
             if (cb !== -1) {
                by = msg.substring(1, cb);
                msg = msg.substring(cb + 1).trim();
             }
          }
          return {
            ts: c.created_at,
            by: by,
            msg: msg
          };
        }) : [],
        auditLog: t.ticket_status_history ? t.ticket_status_history.map(h => {
          let by = 'System';
          let msg = h.comments || `Status changed from ${h.old_status} to ${h.new_status}`;
          if (msg && msg.startsWith('[')) {
             const cb = msg.indexOf(']');
             if (cb !== -1) {
                by = msg.substring(1, cb);
                msg = msg.substring(cb + 1).trim();
             }
          }
          return {
            ts: h.created_at,
            by: by,
            msg: msg
          };
        }) : []
        };
      });

      setTickets(mappedTickets);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchSettings();
    
    // Set up Realtime Subscription
    const subscription = supabase
      .channel('public:tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, payload => {
        console.log('Ticket change received!', payload);
        
        if (payload.eventType === 'UPDATE' && currentUser) {
           const newAssignee = payload.new.conversation_id;
           const oldAssignee = payload.old.conversation_id;
           
           if (newAssignee && newAssignee !== oldAssignee) {
              if (newAssignee === currentUser.label) {
                 toast.success(`You have been assigned to ticket ${payload.new.ticket_number}`);
              } else {
                 toast(`Ticket ${payload.new.ticket_number} was reassigned to ${newAssignee}`);
              }
           }
        }
        
        fetchTickets(); // refetch on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  const visibleTickets = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.seeAll) return tickets;
    if (currentUser.isSupport) return tickets.filter(t => t.assignedTo === currentUser.label || t.raisedBy === currentUser.label);
    if (currentUser.client) return tickets.filter(t => t.client === currentUser.client || t.raisedBy === currentUser.label);
    return tickets.filter(t => t.raisedBy === currentUser.label); // Default fallback: only see your own tickets
  }, [tickets, currentUser]);

  const addTicket = async (ticket) => {
    // Prevent duplicate tickets (same title and user within 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('tickets')
      .select('id')
      .eq('title', ticket.title)
      .eq('customer_name', ticket.raisedBy || 'Unknown')
      .gte('created_at', yesterday)
      .limit(1);

    if (existing && existing.length > 0) {
      toast.error('A recent ticket with this exact summary already exists.');
      return;
    }

    // Convert assignee full_name to user id
    let assignedUserId = null;
    let initialStatus = 'Open';
    
    if (ticket.assignedTo && ticket.assignedTo !== 'Unassigned') {
        const { data: u } = await supabase.from('users').select('id').eq('full_name', ticket.assignedTo).maybeSingle();
        if (u) {
            assignedUserId = u.id;
            initialStatus = 'Assigned';
        }
    }

    let moduleId = null;
    if (ticket.module) {
        const { data: m } = await supabase.from('oracle_modules').select('id').ilike('name', ticket.module).maybeSingle();
        if (m) moduleId = m.id;
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert([{
        ticket_number: `TKT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        title: ticket.title,
        description: ticket.description || '',
        oracle_module_id: moduleId,
        ticket_type: ticket.type,
        request_type: ticket.requestType || 'Standard',
        status: initialStatus,
        priority: ticket.priority || 'Medium',
        company: ticket.client || 'Unknown',
        customer_name: ticket.raisedBy || 'Unknown',
        assigned_to: assignedUserId,
        phone_number: ticket.mobileNo,
        source: 'Portal'
      }])
      .select();
      
    if (!error && data && data.length > 0) {
      const { error: histError } = await supabase.from('ticket_status_history').insert([{
        ticket_id: data[0].id,
        old_status: 'None',
        new_status: 'Open',
        comments: `[${currentUser ? currentUser.label : 'System'}] Ticket created. Status set to Open.`
      }]);
      if (histError) console.error("Error inserting ticket_status_history:", histError);
      fetchTickets();
    }
  };

  const updateTicketStatus = async (id, newStatus) => {
    // get old status
    const t = tickets.find(x => x.id === id);
    const oldStatus = t ? t.status : 'Unknown';

    // Optimistic UI Update
    setTickets(prev => prev.map(ticket => 
      ticket.id === id ? { ...ticket, status: newStatus } : ticket
    ));

    const { error } = await supabase
      .from('tickets')
      .update({ status: newStatus })
      .eq('id', id);
      
    if (!error) {
      const { error: histError } = await supabase.from('ticket_status_history').insert([{
        ticket_id: id,
        old_status: oldStatus,
        new_status: newStatus,
        comments: `[${currentUser ? currentUser.label : 'System'}] Status updated to ${newStatus}`
      }]);
      if (histError) console.error("Error inserting ticket_status_history:", histError);
      
      // Send Email Notification if Resolved or Closed
      if (newStatus === 'Resolved' || newStatus === 'Closed') {
         if (t && t.raisedBy) {
            const { data: customerUser } = await supabase.from('users').select('email').eq('full_name', t.raisedBy).maybeSingle();
            const toEmail = customerUser?.email || (t.client === 'Al Seer Marine' ? 'support@alseermarine.com' : null);

            if (toEmail) {
               apiFetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/emails/resolved`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                     toEmail: toEmail,
                     ticketNumber: t.number || t.id,
                     title: t.summary,
                     resolutionNotes: t.resolution || 'Ticket has been marked as ' + newStatus + '.',
                     portalUrl: `${window.location.origin}/tickets?id=${id}`
                  })
               }).catch(err => console.error(`Failed to send ${newStatus} email:`, err));
            }
         }
      }
      
      fetchTickets();
    } else {
      // Revert on error
      fetchTickets();
    }
  };

  const addComment = async (id, msg) => {
    const { error } = await supabase
      .from('ticket_comments')
      .insert([{
        ticket_id: id,
        comment_text: `[${currentUser ? currentUser.label : 'System'}] ${msg}`,
        source: 'Portal'
      }]);
      
    if (!error) {
      const { error: histError } = await supabase.from('ticket_status_history').insert([{
        ticket_id: id,
        old_status: 'Any',
        new_status: 'Any',
        comments: `[${currentUser ? currentUser.label : 'System'}] Comment added.`
      }]);
      if (histError) console.error("Error inserting ticket_status_history:", histError);
      
      fetchTickets();
      toast.success('Comment posted successfully');
    } else {
      console.error('Error adding comment:', error);
      toast.error('Failed to post comment: ' + (error?.message || 'Database error'));
    }
  };

  const saveResolution = async (id, resolution) => {
    // get old status
    const t = tickets.find(x => x.id === id);
    const oldStatus = t ? t.status : 'Unknown';
    
    // Optimistic Update
    setTickets(prev => prev.map(ticket => 
      ticket.id === id ? { ...ticket, status: 'Resolved', resolution: resolution } : ticket
    ));

    // 1. Update ticket to Resolved and save notes
    const { error } = await supabase
      .from('tickets')
      .update({ 
        status: 'Resolved', 
        resolution_code: resolution,
        resolved_by: currentUser ? currentUser.label : 'System',
        resolved_at: new Date().toISOString()
      })
      .eq('id', id);

    // 2. Add audit log
    if (!error) {
      const { error: histError } = await supabase.from('ticket_status_history').insert([{
        ticket_id: id,
        old_status: oldStatus,
        new_status: 'Resolved',
        comments: `[${currentUser ? currentUser.label : 'System'}] Resolution: ${resolution}`
      }]);
      if (histError) console.error("Error inserting ticket_status_history:", histError);

      // Send Email Notification to Customer
      const resolvedTicket = tickets.find(x => x.id === id);
      if (resolvedTicket) {
        // Use the ticket's email address first, fallback to user lookup with ilike
        let toEmail = resolvedTicket.email;
        
        if (!toEmail && resolvedTicket.raisedBy) {
           const { data: customerUser } = await supabase.from('users').select('email').ilike('full_name', `%${resolvedTicket.raisedBy}%`).maybeSingle();
           toEmail = customerUser?.email;
        }
        
        if (!toEmail && resolvedTicket.client === 'Al Seer Marine') {
           toEmail = 'support@alseermarine.com';
        }

        if (toEmail) {
          apiFetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/emails/resolved`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toEmail: toEmail,
              ticketNumber: resolvedTicket.number || resolvedTicket.id,
              title: resolvedTicket.summary,
              resolutionNotes: resolution,
              portalUrl: `${window.location.origin}/tickets?id=${id}`
            })
          }).then(res => {
            if (res.ok) toast.success(`Resolution email sent to ${toEmail}`);
            else toast.error('Backend failed to send email.');
          }).catch(err => {
            console.error('Failed to send resolved email:', err);
            toast.error('Failed to connect to backend for email.');
          });
        } else {
          toast.error("Resolution saved, but no email sent: Customer email not found in database.");
        }
      }

      fetchTickets();
    } else {
      console.error('Save Resolution Error:', error);
      toast.error('Failed to save resolution: ' + (error?.message || 'Database error'));
      fetchTickets();
    }
  };

  const reassignTicket = async (id, assignedToName) => {
    // Optimistic Update
    setTickets(prev => prev.map(ticket => 
      ticket.id === id ? { ...ticket, assignedTo: assignedToName, status: 'Assigned' } : ticket
    ));

    // Find the real UUID and email for the selected user name
    const { data: users } = await supabase.from('users').select('id, email').eq('full_name', assignedToName).maybeSingle();
    
    if (users) {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_to: users.id, status: 'Assigned' })
        .eq('id', id);
        
      if (!error) {
        const { error: histError } = await supabase.from('ticket_status_history').insert([{
          ticket_id: id,
          old_status: 'Pending Approval',
          new_status: 'Assigned',
          comments: `[${currentUser ? currentUser.label : 'System'}] Manually assigned to ${assignedToName}`
        }]);
        if (histError) console.error("Error inserting ticket_status_history:", histError);

        // Send Email Notification
        if (users.email) {
          const t = tickets.find(x => x.id === id);
          apiFetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/emails/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toEmail: users.email,
              ticketNumber: t.number || t.id,
              title: t.summary,
              priority: t.priority,
              customerDetails: t.raisedBy,
              module: t.module,
              status: 'Assigned',
              assignedBy: currentUser?.label || 'System',
              assignmentDate: new Date().toISOString(),
              slaDueDate: t.expectedDate || new Date(Date.now() + 24*36e5).toISOString(),
              portalUrl: window.location.origin,
              ticketUrl: `${window.location.origin}/tickets?id=${t.id}`
            })
          }).catch(err => console.error('Failed to send assignment email:', err));
        }
      }
    }
    fetchTickets();
  };

  const setActiveClient = (clientId) => {
    setClients(prev => prev.map(c => ({
      ...c,
      active: c.id === clientId
    })));
  };
  
  const getActiveClient = () => {
    if (currentUser && !currentUser.isAdmin && currentUser.client) {
      const myClient = clients.find(c => c.name === currentUser.client);
      if (myClient) return myClient;
    }
    return clients.find(c => c.active) || clients[0];
  };

  // --- CRUD Wrappers for Settings ---
  
  // Users
  const addUser = async (user) => {
    const res = await apiFetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!res.ok) throw new Error(await res.text());
    await fetchSettings();
  };
  const updateUser = async (id, user) => {
    const res = await apiFetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!res.ok) throw new Error(await res.text());
    await fetchSettings();
  };
  const deleteUser = async (id) => {
    const res = await apiFetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    await fetchSettings();
  };

  // Generic DB Actions
  const dbAdd = async (table, data) => {
    const { error } = await supabase.from(table).insert([data]);
    if (error) throw error;
    fetchSettings();
  };
  const dbUpdate = async (table, id, data) => {
    const { error } = await supabase.from(table).update(data).eq('id', id);
    if (error) throw error;
    fetchSettings();
  };
  const dbDelete = async (table, id) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    fetchSettings();
  };
  
  const updateSystemSetting = async (key, value) => {
    const { error } = await supabase.from('system_settings').upsert({ key, value, updated_at: new Date() });
    if (error) throw error;
    fetchSettings();
  };

  return (
    <DataContext.Provider value={{ 
      tickets: visibleTickets, 
      allTickets: tickets,
      clients,
      team: TEAM,
      sla: SLA,
      addTicket, 
      updateTicketStatus,
      setActiveClient,
      getActiveClient,
      addComment,
      saveResolution,
      reassignTicket,
      
      // Settings specific
      usersList, rolesList, teamsList, customerAccounts, slaConfig, oracleModules, incidentTypes, systemSettings,
      addUser, updateUser, deleteUser, dbAdd, dbUpdate, dbDelete, updateSystemSetting
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
