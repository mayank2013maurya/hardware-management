import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireGuest } from '../middleware/auth.js';

const router = express.Router();



// POST / - Handle login (since this router is mounted at /login)
router.post('/', requireGuest, async (req, res) => {
    console.log("Login attempt received");
    try {
        const { username, password } = req.body;
        console.log('Login attempt for username:', username);

        if (!username || !password) {
            console.log('Missing username or password');
            req.flash('error', 'Please enter both username and password');
            return res.redirect('/login');
        }

        // Find user by username
        const user = await User.findOne({ username });
        console.log('User found:', !!user);
        
        if (!user) {
            console.log('User not found');
            req.flash('error', 'Invalid username or password');
            return res.redirect('/login');
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid);
        console.log('Stored password hash:', user.password.substring(0, 20) + '...');
        
        if (!isPasswordValid) {
            console.log('Password validation failed');
            req.flash('error', 'Invalid username or password');
            return res.redirect('/login');
        }

        // Set session
        req.session.userId = user._id;
        req.session.username = user.username;
        
        console.log('Login successful, redirecting to dashboard');
        req.flash('success', 'Login successful');
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error', 'An error occurred during login');
        res.redirect('/login');
    }
});

// GET / - Login page (since this router is mounted at /login)
router.get('/', requireGuest, (req, res) => {
    res.render('auth/login', { 
        title: 'Login - Hardware Management App',
        error: req.flash('error'),
        success: req.flash('success')
    });
});



export default router; 