/**
 * User endpoints
 * Prefix: /v1/user
 */
const bcrypt = require('bcrypt');

const db = require('../datastore/datastore');
const usersRepository = require('../datastore/users');
const User = require('../model/User');
const emailVerifyRepository = require('../datastore/email_verification');
const pubsub = require('../pubsub');

module.exports = function (fastify, opts, next) {
    /**
     * Authentication hook
     */
    fastify.addHook('preHandler', function (req, reply) {
        return req.jwtVerify()
    });

    /**
     * Get user profile
     */
    fastify.get('/profile', async (req, reply) => {
        try {
            // Read login parameters
            const userId = req.user.sub;

            // Get user by userId
            let user = await usersRepository.get(userId);

            // Check if user exists
            if(!user) {
                reply.code(401);
                return {error: "Invalid user"};
            }

            delete user[db.KEY];
            delete user.password_hash;

            return user;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Edit user profile
     */
    fastify.put('/profile', async (req, reply) => {
        try {
            // Read login parameters
            const userId = req.user.sub;

            // Get user by userId
            let user = await usersRepository.get(userId);

            // Check if user exists
            if(!user) {
                reply.code(401);
                return {error: "Invalid user"};
            }

            // All is well, update profile
            user.name = req.body.name || user.name;
            user.university = (req.body.university !== undefined) ? req.body.university : user.university;
            user.major = (req.body.major !== undefined) ? req.body.major : user.major;
            user.mobile_no = (req.body.mobile_no !== undefined) ? req.body.mobile_no : user.mobile_no;
            user.gender = (req.body.gender == User.MALE || req.body.gender == User.FEMALE) ? req.body.gender : user.gender;

            // Check if email is changed. If it is, set email verified to false
            /*if(req.body.email && req.body.email !== user.email) {
                user.email = req.body.email;
                user.email_verified = false;
            }*/
            // For now, ignore email change.

            // Update to database
            await usersRepository.update(user);

            return {success: true, user: user};

        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Edit user password
     */
    fastify.post('/password', async (req, reply) => {
        try {
            // Read login parameters
            const userId = req.user.sub;

            // Get user by userId
            let user = await usersRepository.get(userId);

            // Check if user exists
            if(!user) {
                reply.code(401);
                return {error: "Invalid user"};
            }

            const oldpass = req.body.old_password;
            const newpass = req.body.new_password;

            // User exists, check password
            const hash = user.password_hash;
            const passwordMatch = await bcrypt.compare(oldpass, hash);

            if(!passwordMatch) {
                // Incorrect password
                reply.code(401);
                return {error: "Invalid current password"};
            }

            // All is well, change password
            user.password_hash = bcrypt.hashSync(newpass, usersRepository.HASH_SALT);

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
     * Send email verification mail
     */
    fastify.post('/email_verify', async (req, reply) => {
        try {
            // Read login parameters
            const userId = req.user.sub;

            // Get user by userId
            let user = await usersRepository.get(userId);

            // Check if user exists
            if(!user) {
                reply.code(401);
                return {error: "Invalid user"};
            }

            // Check if email is already verified
            if(user.email_verified === true) {
                reply.code(400);
                return {error: "Email address already verified"};
            }

            // Send email
            await sendEmailVerificationMail(user);

            return {success: true};
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Send email verification message
     * @param user
     * @returns {Promise<void>}
     */
    async function sendEmailVerificationMail(user) {
        // Generate token
        let token = await emailVerifyRepository.generate(user.email);

        // Send email, publish to Pub/Sub topic
        const url = `${process.env.FRONTEND_BASE_URL}/email/verify?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token.token)}&expires=${encodeURIComponent(token.expires)}`;

        let msg = {
            to_address: user.email,
            to_name: user.name,
            template: 'verify',
            template_payload: {
                verify_url: url,
                name: user.name
            }
        };

        // Publish to Pub/Sub
        await pubsub.publishMessage(process.env.SENDMAIL_TOPIC_NAME, JSON.stringify(msg));
    }

    next();
};