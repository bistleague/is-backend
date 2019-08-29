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

    next();
};