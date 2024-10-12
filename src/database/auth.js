const db = require('./connection');

const checkAuth = (roles) => {
    return (req, res, next) => {
        const userId = req.userId;

        db.query('SELECT users.*, roles.name as role FROM users JOIN roles ON users.role_id = roles.id WHERE users.id = ?', [userId], (err, results) => {
            if (err || results.length === 0) {
                return res.status(403).send('Forbidden');
            }

            const user = results[0];
            const now = new Date();

            if (roles.includes(user.role) && (!user.lifetime || new Date(user.lifetime) > now)) {
                next();
            } else {
                res.status(403).send('Forbidden: Your access has expired.');
            }
        });
    };
};

module.exports = { checkAuth };