/**
 * Student ID validation endpoints
 * Prefix: /v1/admin/student-id
 */

const usersRepository = require('../../datastore/users');
const filesRepository = require('../../datastore/files');
const db = require('../../datastore/datastore');

module.exports = function (fastify, opts, next) {
    fastify.addHook('preHandler', function (req, reply, next) {
        return req.jwtVerify({
            verify: { is_admin: true }
        });
    });

    /**
     * List users who have uploaded
     */
    fastify.get('/list', async (req, reply) => {
        try {
            let processedUsers = [];
            const users = await usersRepository.getAllUsers();
            for(let i = 0; i < users.length; i++) {
                const user = users[i];

                if(user.student_id_file_id) {
                    const file = await filesRepository.get(user.student_id_file_id);
                    processedUsers.push({
                        name: user.name,
                        student_id: file.url
                    })
                }
            }

            return processedUsers;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Validate student ID
     */
    fastify.post('/validate', async (req, reply) => {
        try {
            const userId = req.body.user_id;
            const user = await usersRepository.get(userId);

            if(!user) {
                reply.code(404);
                return {error: 'User not found'};
            }

            user.student_id_status = "VERIFIED";
            user.student_id_verified = true;
            user.student_id_rejected = false;

            await usersRepository.update(userId, user);
            return user;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Reject student ID
     */
    fastify.post('/reject', async (req, reply) => {
        try {
            const userId = req.body.user_id;
            const user = await usersRepository.get(userId);

            if(!user) {
                reply.code(404);
                return {error: 'User not found'};
            }

            user.student_id_status = "REJECTED";
            user.student_id_verified = false;
            user.student_id_rejected = true;

            await usersRepository.update(userId, user);
            return user;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    next();
};