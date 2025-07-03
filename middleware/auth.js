export const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        req.flash('error', 'Please log in to access this page');
        res.redirect('/login');
    }
};

export const requireGuest = (req, res, next) => {
    if (req.session && req.session.userId) {
        res.redirect('/');
        
    } else {
        next();
    }
}; 