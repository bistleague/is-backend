/**
 * Competition endpoints
 * Prefix: /v1/competition
 */
const { Config, ConfigKeys } = require("../../model/Config");
const { CompetitionStage } = require("../../model/CompetitionStage");
const { getConfig } = require("../../datastore/config");
const usersRepository = require('../../datastore/users');
const teamsRepository = require('../../datastore/team');


module.exports = function (fastify, opts, next) {
    fastify.addHook('preHandler', async function (req, reply) {
        req.competition_stage = await getConfig(ConfigKeys.COMPETITION_STAGE);

        return req.jwtVerify({
            verify: { is_admin: true }
        });
    });

    fastify.get('/teams', async (req, reply) => {
        const teams = await teamsRepository.getAllTeams();
        return teams;
    });

    require('./competition/team')(fastify);

    next();
};