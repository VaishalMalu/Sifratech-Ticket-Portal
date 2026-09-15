const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabaseClient'); // Note: This uses the service role key
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// GET /api/users
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select(`
            *,
            roles ( name ),
            teams ( name )
        `);
        
        if (error) throw error;

        // Fetch passwords
        const { data: creds, error: credError } = await supabase.from('managed_credentials').select('user_id, plain_password');
        
        const enhancedData = data.map(user => {
            const cred = creds?.find(c => c.user_id === user.id);
            return {
                ...user,
                plain_password: cred ? cred.plain_password : null
            };
        });

        res.json(enhancedData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/users
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { email, password, full_name, role_id, team_id } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const trimmedEmail = email.trim().toLowerCase();

        // 1. Create user in Supabase Auth
        let userId;
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: trimmedEmail,
            password: password,
            email_confirm: true
        });

        if (authError) {
            if (authError.message.includes('already exists') || authError.message.includes('already registered')) {
                const { data: listData } = await supabase.auth.admin.listUsers();
                const existing = listData?.users?.find(u => u.email.toLowerCase() === trimmedEmail);
                if (existing) {
                    userId = existing.id;
                    await supabase.auth.admin.updateUserById(userId, { password });
                } else {
                    return res.status(400).json({ error: authError.message });
                }
            } else {
                console.error('Supabase Auth Error:', authError);
                return res.status(400).json({ error: authError.message });
            }
        } else {
            userId = authUser.user.id;
        }

        // 2. Upsert into public.users table
        const { data: user, error: dbError } = await supabase.from('users').upsert({
            id: userId,
            email: trimmedEmail,
            full_name: full_name || trimmedEmail.split('@')[0],
            role_id: role_id || null,
            team_id: team_id || null,
            is_active: true
        }).select().maybeSingle();

        if (dbError) {
            console.error('DB Error inserting user:', dbError);
            return res.status(400).json({ error: dbError.message });
        }

        // 3. Store in managed_credentials
        const { data: existingCred } = await supabase.from('managed_credentials').select('id').eq('user_id', userId).maybeSingle();
        if (existingCred) {
            await supabase.from('managed_credentials').update({
                email: trimmedEmail,
                plain_password: password,
                updated_at: new Date().toISOString()
            }).eq('id', existingCred.id);
        } else {
            await supabase.from('managed_credentials').insert([{
                user_id: userId,
                email: trimmedEmail,
                plain_password: password
            }]);
        }

        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create user: ' + err.message });
    }
});

// PUT /api/users/:id
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, role_id, team_id, email, password } = req.body;

        const authUpdates = {};
        if (email) authUpdates.email = email.trim().toLowerCase();
        if (password) authUpdates.password = password;
        
        if (Object.keys(authUpdates).length > 0) {
            const { error: authError } = await supabase.auth.admin.updateUserById(id, authUpdates);
            if (authError) return res.status(400).json({ error: authError.message });
        }

        const dbUpdates = { 
            full_name, 
            role_id: role_id || null, 
            team_id: team_id || null 
        };
        if (email) dbUpdates.email = email.trim().toLowerCase();

        const { data: user, error: dbError } = await supabase.from('users')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (dbError) throw dbError;

        // If password or email changed, update managed_credentials
        if (password || email) {
            const { data: existingCred } = await supabase.from('managed_credentials').select('id').eq('user_id', id).maybeSingle();
            if (existingCred) {
                const credUpdates = { updated_at: new Date().toISOString() };
                if (password) credUpdates.plain_password = password;
                if (email) credUpdates.email = email.trim().toLowerCase();
                await supabase.from('managed_credentials').update(credUpdates).eq('id', existingCred.id);
            } else if (password) {
                await supabase.from('managed_credentials').insert([{
                    user_id: id,
                    email: email ? email.trim().toLowerCase() : user.email,
                    plain_password: password
                }]);
            }
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user: ' + err.message });
    }
});

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Delete from managed_credentials
        await supabase.from('managed_credentials').delete().eq('user_id', id);

        // 2. Delete from public.users
        await supabase.from('users').delete().eq('id', id);

        // 3. Delete from Supabase Auth
        const { error } = await supabase.auth.admin.deleteUser(id);
        if (error && !error.message.includes('User not found')) {
            console.error('Auth deletion warning:', error.message);
        }

        res.json({ success: true, message: 'User and credentials deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user: ' + err.message });
    }
});

module.exports = router;
