/**
 * Treasurer private endpoints
 * Prefix: /v1/admin/treasurer
 */

const teamsRepository = require('../../datastore/team');
const filesRepository = require('../../datastore/files');
const db = require('../../datastore/datastore');

module.exports = function (fastify, opts, next) {
    fastify.addHook('preHandler', function (req, reply, next) {
        const authHeader = req.headers.authorization;

        if(authHeader !== process.env.TREASURER_API_SECRET) {
            reply.code(401);
            reply.send({error: 'Unauthorized'});
        } else {
            next();
        }
    });

    /**
     * List teams who have uploaded
     */
    fastify.get('/list', async (req, reply) => {
        try {
            let processedTeams = [];
            const teams = await teamsRepository.getAllTeams();
            for(let i = 0; i < teams.length; i++) {
                const team = teams[i];

                if(team.proof_of_payment_file_id) {
                    const file = await filesRepository.get(team.proof_of_payment_file_id);
                    processedTeams.push({
                        name: team.name,
                        proof_of_payment: file.url
                    })
                }
            }

            return processedTeams;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Validate proof of payment
     */
    fastify.post('/validate', async (req, reply) => {
        try {
            const teamId = req.body.team_id;
            const team = await teamsRepository.getTeamById(teamId);

            if(!team) {
                reply.code(404);
                return {error: 'Team not found'};
            }

            team.proof_of_payment_verified = true;
            team.proof_of_payment_rejected = false;

            await teamsRepository.updateTeam(teamId, team);
            return team;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Reject proof of payment
     */
    fastify.post('/reject', async (req, reply) => {
        try {
            const teamId = req.body.team_id;
            const team = await teamsRepository.getTeamById(teamId);

            if(!team) {
                reply.code(404);
                return {error: 'Team not found'};
            }

            team.proof_of_payment_verified = false;
            team.proof_of_payment_rejected = true;

            await teamsRepository.updateTeam(teamId, team);
            return team;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    next();
};