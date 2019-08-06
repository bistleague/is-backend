/**
 * Competition endpoints
 * Prefix: /v1/competition
 */
const { stage_registrationOpened, stage_registrationClosed } = require("./competition/stage_registration");
const { stage_preliminaryCaseReleased, stage_preliminarySubmissionDeadline, stage_preliminaryStageClosed } = require("./competition/stage_preliminary");
const { stage_semifinalResultsAnnounced, stage_semifinalCaseReleased, stage_semifinalSubmissionDeadline, stage_semifinalStageClosed } = require("./competition/stage_semifinal");
const { stage_finalResultsAnnounced } = require("./competition/stage_final");

const { Config, ConfigKeys } = require("../model/Config");
const { CompetitionStage } = require("../model/CompetitionStage");
const { getConfig } = require("../datastore/config");
const usersRepository = require('../datastore/users');



module.exports = function (fastify, opts, next) {
    fastify.addHook('preHandler', function (req, reply) {
        return req.jwtVerify()
    });

    fastify.get('/', async (req, reply) => {
        const userId = req.user.sub;
        let user = await usersRepository.get(userId);
        if(!user) {
            reply.code(401);
            return {error: "Invalid user"};
        }

        const stageConfig = await getConfig(ConfigKeys.COMPETITION_STAGE);

        switch(stageConfig) {
            case (CompetitionStage.REGISTRATION_OPENED):
                return await stage_registrationOpened(user);
            case (CompetitionStage.REGISTRATION_CLOSED):
                return await stage_registrationClosed(user);
            case (CompetitionStage.PRELIMINARY_CASE_RELEASED):
                return await stage_preliminaryCaseReleased(user);
            case (CompetitionStage.PRELIMINARY_SUBMISSION_DEADLINE):
                return await stage_preliminarySubmissionDeadline(user);
            case (CompetitionStage.PRELIMINARY_STAGE_CLOSED):
                return await stage_preliminaryStageClosed(user);
            case (CompetitionStage.SEMIFINAL_RESULTS_ANNOUNCED):
                return await stage_semifinalResultsAnnounced(user);
            case (CompetitionStage.SEMIFINAL_CASE_RELEASED):
                return await stage_semifinalCaseReleased(user);
            case (CompetitionStage.SEMIFINAL_SUBMISSION_DEADLINE):
                return await stage_semifinalSubmissionDeadline(user);
            case (CompetitionStage.SEMIFINAL_STAGE_CLOSED):
                return await stage_semifinalStageClosed(user);
            case (CompetitionStage.FINAL_RESULTS_ANNOUNCED):
                return await stage_finalResultsAnnounced(user);
            default:
                return {};
        }
    });

    require('./competition/team')(fastify);

    next();
};