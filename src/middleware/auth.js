export const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/login');
    }
};

export const isNotAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return res.redirect('/profile');
    } else {
        return next(); 
    }
};