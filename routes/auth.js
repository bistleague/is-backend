/**
 * Auth endpoints
 * Prefix: /v1/auth
 */

const bcrypt = require('bcrypt');
const usersRepository = require('../datastore/users');
const validator = require('validator');

module.exports = function (fastify, opts, next) {
    /**
     * List identities belonging to a NIK
     */
    fastify.post('/login', async (req, reply) => {
        try {
            // Read login parameters
            const email = validator.normalizeEmail(req.body.email);
            const password = req.body.password;

            // Get user with the same email
            let user = await usersRepository.getByEmail(email);

            // Check if user exists
            if(!user) {
                reply.code(401);
                return {error: "Invalid username and/or password"};
            }

            // User exists, check password
            const hash = user.password_hash;
            const passwordMatch = await bcrypt.compare(password, hash);

            if(!passwordMatch) {
                // Incorrect password
                reply.code(401);
                return {error: "Invalid username and/or password"};
            }

            // All is well, build JWT
            const payload = {
                sub: user.id,
                email: user.email,
                full_name: user.name,
                is_admin: user.is_admin
            };

            const options = {
                expiresIn: parseInt(process.env.JWT_EXPIRES_IN) || 3600,
            };

            const token = fastify.jwt.sign(payload, options);

            // Compute expiry
            const exp = Math.round((new Date()).getTime() / 1000) + options.expiresIn;

            // Return reply
            reply.header("Authorization", `Bearer ${token}`);
            return {user: payload, token: token, expires_at: exp};
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    next();
};