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

        // 1. Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) {
            console.error('Supabase Auth Error:', authError);
            return res.status(400).json({ error: authError.message });
        }

        // 2. Insert into public.users table
        const { data: user, error: dbError } = await supabase.from('users').insert([{
            id: authUser.user.id,
            email,
            full_name,
            role_id: role_id || null,
            team_id: team_id || null
        }]).select().maybeSingle();

        if (dbError) {
            console.error('DB Error inserting user:', dbError);
            // Optionally, delete auth user here to rollback
            await supabase.auth.admin.deleteUser(authUser.user.id);
            return res.status(400).json({ error: dbError.message });
        }

        // 3. Store in managed_credentials
        await supabase.from('managed_credentials').insert([{
            user_id: authUser.user.id,
            email,
            plain_password: password
        }]);

        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /api/users/:id
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, role_id, team_id, email, password } = req.body;

        // Optional: Update auth user (e.g. email or password)
        const authUpdates = {};
        if (email) authUpdates.email = email;
        if (password) authUpdates.password = password;
        
        if (Object.keys(authUpdates).length > 0) {
            const { error: authError } = await supabase.auth.admin.updateUserById(id, authUpdates);
            if (authError) return res.status(400).json({ error: authError.message });
        }

        // Update public.users
        const dbUpdates = { full_name, role_id: role_id || null, team_id: team_id || null };
        if (email) dbUpdates.email = email;

        // If password is changed, update managed_credentials
        if (password) {
            await supabase.from('managed_credentials')
                .update({ plain_password: password, updated_at: new Date().toISOString() })
                .eq('user_id', id);
        }

        const { data: user, error: dbError } = await supabase.from('users')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (dbError) throw dbError;
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        // Deleting from auth.users will cascade to public.users because of the ON DELETE CASCADE constraint
        const { error } = await supabase.auth.admin.deleteUser(id);
        
        if (error && !error.message.includes('User not found')) {
            console.error('Auth deletion error:', error);
            return res.status(400).json({ error: error.message });
        }
        
        // Also force delete from public.users just in case it was an orphaned record
        await supabase.from('users').delete().eq('id', id);

        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;
