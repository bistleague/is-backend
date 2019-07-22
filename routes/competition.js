/**
 * Competition endpoints
 * Prefix: /v1/competition
 */
const { Team, TeamStage } = require("../model/Team");
const { saveTeam } = require("../datastore/team");

const db = require('../datastore/datastore');
const usersRepository = require('../datastore/users');

module.exports = function (fastify, opts, next) {
    /**
     * Authentication hook
     */
    fastify.addHook('preHandler', function (req, reply) {
        return req.jwtVerify()
    });

    /**
     * Create team
     */
    fastify.post('/create', async (req, reply) => {
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

            // Check if user is in a team
            if(user.team_id) {
                console.log("teamId", user.team_id);
                reply.code(400);
                return {error: "User already has a team"};
            }

            // All is well
            const team = {
                name: req.body.name,
                university: req.body.university,
                stage: TeamStage.STAGE_REGISTERED
            };

            const savedTeam = await saveTeam(team);

            // Assign team to user
            user.team_id = savedTeam.team_id;
            await usersRepository.update(userId, user);

            console.log("User", user);

            return savedTeam;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    next();
};