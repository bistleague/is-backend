/**
 * Competition endpoints
 * Prefix: /v1/competition
 */
const { Team, TeamStage } = require("../model/Team");
const { Config, ConfigKeys } = require("../model/Config");
const { CompetitionStage } = require("../model/CompetitionStage");
const { saveTeam, updateTeam, getTeamById, getTeamByInviteCode } = require("../datastore/team");
const { getConfig } = require("../datastore/config");
const { generateInviteCode } = require("../helper");

const db = require('../datastore/datastore');
const usersRepository = require('../datastore/users');
const filesRepository = require('../datastore/files');
const {upload} = require('../datastore/file_storage');

module.exports = function (fastify, opts, next) {
    /**
     * Authentication hook
     */
    fastify.addHook('preHandler', function (req, reply) {
        return req.jwtVerify()
    });

    fastify.get('/', async (req, reply) => {
        // Read login parameters
        const userId = req.user.sub;

        // Get user by userId
        let user = await usersRepository.get(userId);

        // Check if user exists
        if(!user) {
            reply.code(401);
            return {error: "Invalid user"};
        }

        const stageConfig = await getConfig(ConfigKeys.COMPETITION_STAGE);

        switch(stageConfig) {
            case (CompetitionStage.REGISTRATION_OPENED):
                return await stage_registrationOpened(user.team_id);
            default:
                return {};
        }
    });

    /**
     * Create team
     */
    fastify.post('/team', async (req, reply) => {
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
                reply.code(400);
                return {error: "User already has a team"};
            }

            // All is well
            const team = {
                stage: TeamStage.STAGE_REGISTERED,
                invite_code: await findUniqueInviteCode()
            };

            const savedTeam = await saveTeam(team);

            // Assign team to user
            user.team_id = savedTeam.team_id;
            await usersRepository.update(userId, user);

            return savedTeam;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Update team
     */
    fastify.put('/team', async (req, reply) => {
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
            const teamId = user.team_id;
            if(!teamId) {
                reply.code(400);
                return {error: "User is not in a team"};
            }

            await updateTeam(teamId, {
                name: req.body.name,
                university: req.body.university
            });

            return {success: true};
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Upload proof of payment
     */
    fastify.route({
        method: 'POST',
        url: '/upload_pop',
        preHandler: upload.single('file'),
        handler: async function(req, reply) {
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
            const teamId = user.team_id;
            if(!teamId) {
                reply.code(400);
                return {error: "User is not in a team"};
            }

            const file = req.file;

            // Add to Database
            const dbFile = await filesRepository.add(new File('', file.filename, file.path));

            await updateTeam(teamId, {
                proof_of_payment_file_id: dbFile.id,
                proof_of_payment_verified: false
            });

            // request.file is the `avatar` file
            // request.body will hold the text fields, if there were any
            reply.code(200).send();
        }
    });

    async function stage_registrationOpened(teamId) {
        const team = await getTeamById(teamId);

        if(!team)
            return {step: 0};

        let memberUsers = await usersRepository.getByTeamId(teamId);
        let teamMembers = memberUsers.map((user) => {
            return {
                name: user.name,
                id: user.id,
                email: user.email,
                student_id: {
                    uploaded: !(!user.student_id_file_id),
                    status: "PENDING", // TODO get status,
                    filename: "",    // TODO get filename
                    url: "" // TODO get url
                },
                proof_of_enrollment: {
                    uploaded: !(!user.poe_file_id),
                    status: "VERIFIED", // TODO get status,
                    filename: "",    // TODO get filename
                    url: "" // TODO get url
                }
            }
        });

        return {
            step: 1,
            data: {
                team_name: team.name,
                university: team.university,
                invite_code: team.invite_code,
                payment: {
                    uploaded: !(!team.proof_of_payment_file_id),
                    status: "PENDING"   // TODO status
                },
                team_members: teamMembers
            }
        }
    }

    async function findUniqueInviteCode() {
        const INVITE_CODE_LENGTH = 6;

        let inviteCode = generateInviteCode(INVITE_CODE_LENGTH);

        while(await inviteCodeExists(inviteCode)) {
            inviteCode = generateInviteCode(INVITE_CODE_LENGTH);
        }

        return inviteCode;

    }

    async function inviteCodeExists(inviteCode) {
        const team = await getTeamByInviteCode(inviteCode);
        return !!team;
    }

    next();
};