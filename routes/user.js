/**
 * User endpoints
 * Prefix: /v1/user
 */
const bcrypt = require('bcrypt');

const db = require('../datastore/datastore');
const usersRepository = require('../datastore/users');
const User = require('../model/User');

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
            user.gender = (req.body.gender === User.MALE || req.body.gender === User.FEMALE) ? req.body.gender : user.gender;

            // Check if email is changed. If it is, set email verified to false
            if(req.body.email && req.body.email !== user.email) {
                user.email = req.body.email;
                user.email_verified = false;
            }

            // Check if password is changed. If it is, generate hash and update
            if(req.body.password) {
                user.password_hash = bcrypt.hashSync(req.body.password, usersRepository.HASH_SALT);
            }

            // Update to database
            usersRepository.update(userId, user);

            delete user.password_hash;

            return {success: true, user: user};

        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    next();
};