/**
 * Proof of enrollment validation endpoints
 * Prefix: /v1/admin/documents
 */

const usersRepository = require('../../datastore/users');
const teamRepository = require('../../datastore/team');
const filesRepository = require('../../datastore/files');
const db = require('../../datastore/datastore');

module.exports = function (fastify, opts, next) {
    fastify.addHook('preHandler', function (req, reply, next) {
        return req.jwtVerify({
            verify: {is_admin: true}
        });
    });

    fastify.get('/team', async (req, reply) => {
        const teamId = req.query.team_id;
        const team = await teamRepository.getTeamById(teamId);

        if (!team) {
            reply.code(404);
            return {error: 'Team not found'};
        }

        const users = await usersRepository.getByTeamId(teamId);
        let outputUsers = [];
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            let outputUser = {
                name: user.name,
                student_id_verified: user.student_id_verified === true,
                student_id_rejected: user.student_id_rejected === true,
                poe_verified: user.poe_verified === true,
                poe_rejected: user.poe_rejected === true,
                university: user.university,
                major: user.major,
                email: user.email,
                mobile_no: user.mobile_no,
                user_id: user.id
            };

            if (user.poe_file_id) {
                const poeFile = await filesRepository.get(user.poe_file_id);
                outputUser.poe_file_url = poeFile.url;
                outputUser.poe_filename = poeFile.filename.split('/').pop();
            }

            if (user.student_id_file_id) {
                const stdidFile = await filesRepository.get(user.student_id_file_id);
                outputUser.student_id_file_url = stdidFile.url;
                outputUser.student_id_filename = stdidFile.filename.split('/').pop();
            }

            outputUsers.push(outputUser);
        }

        return {team, users: outputUsers}
    });

    /**
     * Validate proof of enrollment
     */
    fastify.post('/poe/validate', async (req, reply) => {
        try {
            const userId = req.body.user_id;
            let user = await usersRepository.get(userId);

            if (!user) {
                reply.code(404);
                return {error: 'User not found'};
            }

            user.poe_status = "VERIFIED";
            user.poe_verified = true;
            user.poe_rejected = false;

            await usersRepository.update(user);
            return user;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Reject proof of enrollment
     */
    fastify.post('/poe/reject', async (req, reply) => {
        try {
            const userId = req.body.user_id;
            let user = await usersRepository.get(userId);

            if (!user) {
                reply.code(404);
                return {error: 'User not found'};
            }

            user.poe_status = "REJECTED";
            user.poe_verified = false;
            user.poe_rejected = true;

            await usersRepository.update(user);
            return user;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Validate student ID
     */
    fastify.post('/student-id/validate', async (req, reply) => {
        try {
            const userId = req.body.user_id;
            let user = await usersRepository.get(userId);

            if (!user) {
                reply.code(404);
                return {error: 'User not found'};
            }

            user.student_id_status = "VERIFIED";
            user.student_id_verified = true;
            user.student_id_rejected = false;

            await usersRepository.update(user);
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
    fastify.post('/student-id/reject', async (req, reply) => {
        try {
            const userId = req.body.user_id;
            let user = await usersRepository.get(userId);

            if (!user) {
                reply.code(404);
                return {error: 'User not found'};
            }

            user.student_id_status = "REJECTED";
            user.student_id_verified = false;
            user.student_id_rejected = true;

            await usersRepository.update(user);
            return user;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    next();
};