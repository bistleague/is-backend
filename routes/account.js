/**
 * Account public endpoints
 * Prefix: /v1/account
 */

const bcrypt = require('bcrypt');
const usersRepository = require('../datastore/users');

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

            return {hello: 'world'};
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