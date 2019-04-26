/**
 * Account public endpoints
 * Prefix: /v1/account
 */

const bcrypt = require('bcrypt');
const usersRepository = require('../datastore/users');
const User = require('../model/User');

module.exports = function (fastify, opts, next) {
    /**
     * Create new account
     */
    fastify.post('/create', async (req, reply) => {
        try {
            // TODO implement
            const name = req.body.name;
            const email = req.body.email;
            const password = req.body.password;

            // Create User entity
            // Create password hash
            const hash = bcrypt.hashSync(password, usersRepository.HASH_SALT);

            let user = new User(name, email, hash);

            try {
                usersRepository.add(user);
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
     * Recover account
     */
    fastify.post('/recover', async (req, reply) => {
        try {
            // TODO implement
            const email = req.body.email;

            return {hello: 'world'};
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
            // TODO implement
            const email = req.body.email;
            const token = req.body.token;

            return {hello: 'world'};
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    next();
};