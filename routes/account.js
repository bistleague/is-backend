/**
 * Account public endpoints
 * Prefix: /v1/account
 */

const bcrypt = require('bcrypt');
const usersRepository = require('../datastore/users');
const passResetRepository = require('../datastore/password_reset');
const emailVerifyRepository = require('../datastore/email_verification');
const pubsub = require('../pubsub');
const User = require('../model/User');
const db = require('../datastore/datastore');
const validator = require('validator');

module.exports = function (fastify, opts, next) {
    /**
     * Create new account
     */
    fastify.post('/create', async (req, reply) => {
        try {
            const name = req.body.name;
            const email = validator.normalizeEmail(req.body.email);
            const password = req.body.password;

            // Create User entity
            // Create password hash
            const hash = bcrypt.hashSync(password, usersRepository.HASH_SALT);

            let user = new User(name, email, hash, {created_time: Date.now()});

            try {
                // Add to database
                await usersRepository.add(user);

                // Send welcome email
                await sendWelcomeEmail(user);
            } catch (e) {
                reply.code(400);
                return {error: e.toString()}
            }

            return {success: true};
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Send welcome email to user on sign up
     * @param user
     * @returns {Promise<void>}
     */
    async function sendWelcomeEmail(user) {
        // Generate token
        let token = await emailVerifyRepository.generate(user.email);

        // Send email, publish to Pub/Sub topic
        const url = `${process.env.FRONTEND_BASE_URL}/email/verify?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token.token)}&expires=${encodeURIComponent(token.expires)}`;

        let msg = {
            to_address: user.email,
            to_name: user.name,
            template: 'welcome',
            template_payload: {
                verify_url: url,
                name: user.name
            }
        };

        // Publish to Pub/Sub
        await pubsub.publishMessage(process.env.SENDMAIL_TOPIC_NAME, JSON.stringify(msg));
    }

    /**
     * Recover account
     */
    fastify.post('/recover', async (req, reply) => {
        try {
            const email = validator.normalizeEmail(req.body.email);

            // See if email is registered
            const user = await usersRepository.getByEmail(email);

            if(!user) {
                reply.code(400);
                return {error: 'Email address is not registered'};
            }

            // Generate token
            let token = await passResetRepository.generate(user.email);

            // Send email, publish to Pub/Sub topic
            const resetUrl = `${process.env.FRONTEND_BASE_URL}/reset?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token.token)}&expires=${encodeURIComponent(token.expires)}`;

            let msg = {
                to_address: user.email,
                to_name: user.name,
                subject: 'Forgot password',
                template: 'recovery',
                template_payload: {
                    reset_url: resetUrl,
                    name: user.name
                }
            };

            // Publish to Pub/Sub
            await pubsub.publishMessage(process.env.SENDMAIL_TOPIC_NAME, JSON.stringify(msg));

            return {success: true};
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Reset password
     */
    fastify.post('/reset', async (req, reply) => {
        try {
            const email = validator.normalizeEmail(req.body.email);
            const token = req.body.token;
            const password = req.body.password;

            // Retrieve token
            let dbToken = await passResetRepository.get(email);

            if(!dbToken) {
                reply.code(404);
                return {error: 'Token is invalid or expired'};
            }

            // Token found, check validity
            if(token !== dbToken.token) {
                reply.code(404);
                return {error: 'Token is invalid or expired'};
            }

            // Invalidate token
            await passResetRepository.invalidate(email);

            // Get user object
            let user = await usersRepository.getByEmail(email);

            if(!user) {
                reply.code(500);
                return {error: 'User does not exist'};
            }

            // All is well, change password
            user.password_hash = bcrypt.hashSync(password, usersRepository.HASH_SALT);

            // Update to database
            await usersRepository.update(user);

            return {success: true};
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Verify email
     */
    fastify.post('/verify_email', async (req, reply) => {
        try {
            const email = validator.normalizeEmail(req.body.email);
            const token = req.body.token;

            // Retrieve token
            let dbToken = await emailVerifyRepository.get(email);

            if(!dbToken) {
                reply.code(404);
                return {error: 'Token is invalid or expired'};
            }

            // Token found, check validity
            if(token !== dbToken.token) {
                reply.code(404);
                return {error: 'Token is invalid or expired'};
            }

            // Invalidate token
            await emailVerifyRepository.invalidate(email);

            // Get user object
            let user = await usersRepository.getByEmail(email);

            if(!user) {
                reply.code(500);
                return {error: 'User does not exist'};
            }

            // All is well, set email verified to true
            user.email_verified = true;

            // Update to database
            await usersRepository.update(user);

            return {success: true};
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    next();
};