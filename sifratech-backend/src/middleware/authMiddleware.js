const { supabase } = require('../config/supabaseClient');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid Authorization header' });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify the token using Supabase Auth
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

const adminMiddleware = async (req, res, next) => {
    try {
        // Ensure authMiddleware ran first
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Fetch user role from DB
        const { data: userData, error } = await supabase
            .from('users')
            .select('roles(name)')
            .eq('id', req.user.id)
            .single();

        if (error || !userData) {
            return res.status(403).json({ error: 'Failed to verify admin status' });
        }

        const roleName = userData.roles?.name;
        if (roleName !== 'Admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        next();
    } catch (err) {
        console.error('Admin Middleware Error:', err);
        res.status(500).json({ error: 'Internal server error during authorization' });
    }
};

module.exports = { authMiddleware, adminMiddleware };
