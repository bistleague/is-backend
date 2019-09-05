/**
 * Competition endpoints
 * Prefix: /v1/competition
 */
const { Config, ConfigKeys } = require("../../model/Config");
const { CompetitionStage } = require("../../model/CompetitionStage");
const { getConfig } = require("../../datastore/config");
const usersRepository = require('../../datastore/users');
const teamsRepository = require('../../datastore/team');
const filesRepository = require('../../datastore/files');


module.exports = function (fastify, opts, next) {
    fastify.addHook('preHandler', async function (req, reply) {
        req.competition_stage = await getConfig(ConfigKeys.COMPETITION_STAGE);

        return req.jwtVerify({
            verify: { is_admin: true }
        });
    });

    fastify.get('/teams', async (req, reply) => {
        const teams = await teamsRepository.getAllTeams();

        let processedTeams = [];
        for (let i = 0; i < teams.length; i++) {
            const team = teams[i];

            const preliminaryFileId = team.preliminary_submission_file_id;
            let preliminaryData;
            if(preliminaryFileId) {
                const preliminaryFile = await filesRepository.get(preliminaryFileId);
                preliminaryData = {
                    file_url: preliminaryFile.url,
                    file_name: preliminaryFile.filename,
                    submitted_at: team.preliminary_submission_last_submitted
                };
            }

            const semifinalFileId = team.semifinal_submission_file_id;
            let semifinalData;
            if(semifinalFileId) {
                const semifinalFile = await filesRepository.get(semifinalFileId);
                semifinalData = {
                    file_url: semifinalFile.url,
                    file_name: semifinalFile.filename.split('/').pop(),
                    submitted_at: team.semifinal_submission_last_submitted
                };
            }

            processedTeams.push({
                ...team,
                preliminary: preliminaryData,
                semifinal: semifinalData
            });
        }
        return processedTeams;
    });

    /**
     * Qualify team to semifinal
     */
    fastify.post('/semifinal/qualified', async (req, reply) => {
        try {
            const teamId = req.body.team_id;
            const team = await teamsRepository.getTeamById(teamId);

            if(!team) {
                reply.code(404);
                return {error: 'Team not found'};
            }

            team.semifinal_qualified = true;

            await teamsRepository.updateTeam(teamId, team);
            return team;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });
    fastify.post('/semifinal/not-qualified', async (req, reply) => {
        try {
            const teamId = req.body.team_id;
            const team = await teamsRepository.getTeamById(teamId);

            if(!team) {
                reply.code(404);
                return {error: 'Team not found'};
            }

            team.semifinal_qualified = false;

            await teamsRepository.updateTeam(teamId, team);
            return team;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Qualify team to final
     */
    fastify.post('/final/qualified', async (req, reply) => {
        try {
            const teamId = req.body.team_id;
            const team = await teamsRepository.getTeamById(teamId);

            if(!team) {
                reply.code(404);
                return {error: 'Team not found'};
            }

            team.final_qualified = true;

            await teamsRepository.updateTeam(teamId, team);
            return team;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });
    fastify.post('/final/not-qualified', async (req, reply) => {
        try {
            const teamId = req.body.team_id;
            const team = await teamsRepository.getTeamById(teamId);

            if(!team) {
                reply.code(404);
                return {error: 'Team not found'};
            }

            team.final_qualified = false;

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