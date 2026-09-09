const { supabase } = require('../config/supabaseClient');

const accountManagerMiddleware = async (req, res, next) => {
    try {
        // Ensure authMiddleware ran first
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const authEmail = (req.user.email || '').trim().toLowerCase();

        // 1. Direct email check (supports account_manager@sifratc.com, account_manager@sifratech.com, etc.)
        if (
            authEmail === 'account_manager@sifratc.com' ||
            authEmail === 'account_manager@sifratech.com' ||
            authEmail.startsWith('account_manager@')
        ) {
            return next();
        }

        // 2. Fetch user role from DB
        const { data: userData, error } = await supabase
            .from('users')
            .select('email, roles(name)')
            .eq('id', req.user.id)
            .maybeSingle();

        const roleName = (userData?.roles?.name || '').trim().toLowerCase();
        const dbEmail = (userData?.email || '').trim().toLowerCase();

        if (
            roleName === 'account manager' ||
            roleName === 'admin' ||
            dbEmail === 'account_manager@sifratc.com' ||
            dbEmail === 'account_manager@sifratech.com' ||
            dbEmail.startsWith('account_manager@')
        ) {
            return next();
        }

        console.warn(`[Forbidden 403] AM Access Denied: userId=${req.user.id}, authEmail=${authEmail}, dbEmail=${dbEmail}, roleName=${roleName}`);
        return res.status(403).json({ 
            error: 'Forbidden: Account Manager access required',
            currentRole: roleName || 'None',
            currentEmail: authEmail || dbEmail
        });
    } catch (err) {
        console.error('Account Manager Middleware Error:', err);
        res.status(500).json({ error: 'Internal server error during authorization' });
    }
};

module.exports = { accountManagerMiddleware };
