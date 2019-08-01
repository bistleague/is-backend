/**
 * Competition endpoints
 * Prefix: /v1/competition
 */
const { DocumentStatus } = require("../model/DocumentStatus");
const { Team, TeamStage } = require("../model/Team");
const { Config, ConfigKeys } = require("../model/Config");
const { CompetitionStage } = require("../model/CompetitionStage");
const { saveTeam, updateTeam, getTeamById, getTeamByInviteCode, deleteTeam } = require("../datastore/team");
const { getConfig } = require("../datastore/config");
const { generateInviteCode } = require("../helper");

const db = require('../datastore/datastore');
const usersRepository = require('../datastore/users');
const filesRepository = require('../datastore/files');
const File = require('../model/File');
const {upload, deleteFile} = require('../datastore/file_storage');

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
            default:
                return {};
        }
    });

    fastify.post('/team', async (req, reply) => {
        try {
            const userId = req.user.sub;
            let user = await usersRepository.get(userId);
            if(!user) {
                reply.code(401);
                return {error: "Invalid user"};
            }

            if(user.team_id) {
                reply.code(400);
                return {error: "User already has a team"};
            }

            const team = {
                stage: TeamStage.STAGE_REGISTERED,
                invite_code: await findUniqueInviteCode(),
                created_time: Date.now()
            };

            const savedTeam = await saveTeam(team);

            user.team_id = savedTeam.team_id;
            await usersRepository.update(userId, user);

            return savedTeam;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    fastify.put('/team', async (req, reply) => {
        try {
            const userId = req.user.sub;
            let user = await usersRepository.get(userId);
            if(!user) {
                reply.code(401);
                return {error: "Invalid user"};
            }

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

    fastify.post('/team/invite_code', async (req, reply) => {
        try {
            const userId = req.user.sub;
            let user = await usersRepository.get(userId);
            if(!user) {
                reply.code(401);
                return {error: "Invalid user"};
            }

            const teamId = user.team_id;
            if(!teamId) {
                reply.code(400);
                return {error: "User is not in a team"};
            }

            const inviteCode = await findUniqueInviteCode();

            await updateTeam(teamId, {
                invite_code: inviteCode
            });

            return {success: true, code: inviteCode};
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    fastify.post('/team/member', async (req, reply) => {
        try {
            const userId = req.user.sub;
            let user = await usersRepository.get(userId);
            if(!user) {
                reply.code(401);
                return {error: "Invalid user"};
            }

            if(user.team_id) {
                reply.code(400);
                return {error: "User already has a team"};
            }

            const team = await getTeamByInviteCode(req.body.invite_code);

            if(!team) {
                reply.code(404);
                return {error: "Invite code invalid"};
            }

            user.team_id = team.team_id;
            await usersRepository.update(userId, user);

            return team;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    fastify.delete('/team/member', async (req, reply) => {
        try {
            const userId = req.user.sub;

            let user = await usersRepository.get(userId);
            if(!user) {
                reply.code(401);
                return {error: "Invalid user"};
            }

            const teamId = user.team_id;

            if(!teamId) {
                reply.code(400);
                return {error: "User is not in a team"};
            }

            const targetUserId = req.query.user;
            let targetUser;
            if(targetUserId) {
                targetUser = await usersRepository.get(targetUserId);
            } else {
                targetUser = user;
            }

            if(!targetUser) {
                reply.code(404);
                return {error: "User not found"};
            }

            if(targetUser.team_id !== teamId) {
                reply.code(401);
                return {error: "User is not in the same team"};
            }

            targetUser.team_id = null;
            await usersRepository.update(targetUser.id, targetUser);

            // Check if team has no more user
            const users = await usersRepository.getByTeamId(teamId);

            if(users.length === 0) {
                await deleteTeamAndItsResources(teamId);
            }

            return {success: true};
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    fastify.route({
        method: 'POST',
        url: '/team/pop',
        preHandler: upload.single('file'),
        handler: async function(req, reply) {
            const userId = req.user.sub;
            let user = await usersRepository.get(userId);
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
            const url = `${process.env.GCP_STORAGE_BASE_URL}/${file.filename}`;
            const dbFile = await filesRepository.add(new File('', file.filename, url));

            await updateTeam(teamId, {
                proof_of_payment_file_id: dbFile.id,
                proof_of_payment_verified: false
            });

            reply.code(200).send();
        }
    });

    /**
     * Delete proof of payment
     */
    fastify.route({
        method: 'DELETE',
        url: '/team/pop',
        handler: async function(req, reply) {
            const userId = req.user.sub;
            let user = await usersRepository.get(userId);
            if(!user) {
                reply.code(401);
                return {error: "Invalid user"};
            }

            const teamId = user.team_id;
            if(!teamId) {
                reply.code(400);
                return {error: "User is not in a team"};
            }

            const team = await getTeamById(teamId);
            const fileId = team.proof_of_payment_file_id;
            if(!fileId) {
                reply.code(400);
                return {error: "Proof of payment is not yet uploaded"};
            }

            const file = await filesRepository.get(fileId);
            deleteFile(file.filename);

            await filesRepository.delete(fileId);

            await updateTeam(teamId, {
                proof_of_payment_file_id: null,
                proof_of_payment_verified: false
            });

            reply.code(200).send({success: true});
        }
    });

    fastify.route({
        method: 'POST',
        url: '/team/student_id',
        preHandler: upload.single('file'),
        handler: async function(req, reply) {
            const userId = req.user.sub;
            const user = await usersRepository.get(userId);
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

            const targetUserId = req.query.user;
            const targetUser = await usersRepository.get(targetUserId);
            if(!targetUser) {
                reply.code(401);
                return {error: "Invalid user"};
            }

            if(user.team_id !== targetUser.team_id) {
                reply.code(401);
                return {error: "User is not in the same team"};
            }

            const file = req.file;

            // Add to Database
            const url = `${process.env.GCP_STORAGE_BASE_URL}/${file.filename}`;
            const dbFile = await filesRepository.add(new File('', file.filename, url));

            targetUser.student_id_file_id = dbFile.id;
            targetUser.student_id_status = DocumentStatus.PENDING;
            await usersRepository.update(targetUser.id, targetUser);

            reply.code(200).send();
        }
    });

    fastify.route({
        method: 'DELETE',
        url: '/team/student_id',
        handler: async function(req, reply) {
            const userId = req.user.sub;
            const user = await usersRepository.get(userId);
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

            const targetUserId = req.query.user;
            const targetUser = await usersRepository.get(targetUserId);
            if(!targetUser) {
                reply.code(401);
                return {error: "Invalid user"};
            }

            if(user.team_id !== targetUser.team_id) {
                reply.code(401);
                return {error: "User is not in the same team"};
            }

            const fileId = targetUser.student_id_file_id;
            if(!fileId) {
                reply.code(400);
                return {error: "Student ID is not yet uploaded"};
            }

            const file = await filesRepository.get(fileId);
            deleteFile(file.filename);

            await filesRepository.delete(fileId);

            targetUser.student_id_file_id = null;
            targetUser.student_id_status = DocumentStatus.NOT_UPLOADED;

            await usersRepository.update(targetUserId, targetUser);

            reply.code(200).send({success: true});
        }
    });

    fastify.route({
        method: 'POST',
        url: '/team/poe',
        preHandler: upload.single('file'),
        handler: async function(req, reply) {
            const userId = req.user.sub;
            const user = await usersRepository.get(userId);
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

            const targetUserId = req.query.user;
            const targetUser = await usersRepository.get(targetUserId);
            if(!targetUser) {
                reply.code(401);
                return {error: "Invalid user"};
            }

            if(user.team_id !== targetUser.team_id) {
                reply.code(401);
                return {error: "User is not in the same team"};
            }

            const file = req.file;

            // Add to Database
            const url = `${process.env.GCP_STORAGE_BASE_URL}/${file.filename}`;
            const dbFile = await filesRepository.add(new File('', file.filename, url));

            targetUser.poe_file_id = dbFile.id;
            targetUser.poe_status = DocumentStatus.PENDING;
            await usersRepository.update(targetUser.id, targetUser);

            reply.code(200).send();
        }
    });

    fastify.route({
        method: 'DELETE',
        url: '/team/poe',
        handler: async function(req, reply) {
            const userId = req.user.sub;
            const user = await usersRepository.get(userId);
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

            const targetUserId = req.query.user;
            const targetUser = await usersRepository.get(targetUserId);
            if(!targetUser) {
                reply.code(401);
                return {error: "Invalid user"};
            }

            if(user.team_id !== targetUser.team_id) {
                reply.code(401);
                return {error: "User is not in the same team"};
            }

            const fileId = targetUser.poe_file_id;
            if(!fileId) {
                reply.code(400);
                return {error: "PoE is not yet uploaded"};
            }

            const file = await filesRepository.get(fileId);
            deleteFile(file.filename);

            await filesRepository.delete(fileId);

            targetUser.poe_file_id = null;
            targetUser.poe_status = DocumentStatus.NOT_UPLOADED;

            await usersRepository.update(targetUserId, targetUser);

            reply.code(200).send({success: true});
        }
    });

    async function stage_registrationOpened(user) {
        const teamId = user.team_id;
        const userId = user.id;

        if(!isProfileComplete(user)) {
            return {step: -1, error: 'PROFILE_INCOMPLETE'};
        }

        const team = await getTeamById(teamId);

        if(!team)
            return {step: 0};

        let memberUsers = await usersRepository.getByTeamId(teamId);
        let teamMembers = [];
        for(let i = 0; i < memberUsers.length; i++) {
            const memberUser = memberUsers[i];

            let studentIdFile;
            let studentIdStatus;
            let proofOfEnrollmentFile;
            let proofOfEnrollmentStatus;

            if(memberUser.student_id_file_id) {
                studentIdFile = await filesRepository.get(memberUser.student_id_file_id);
                studentIdStatus = memberUser.student_id_status || DocumentStatus.NOT_UPLOADED;
            }

            if(memberUser.poe_file_id) {
                proofOfEnrollmentFile = await filesRepository.get(memberUser.poe_file_id);
                proofOfEnrollmentStatus = memberUser.poe_status || DocumentStatus.NOT_UPLOADED;
            }

            const member = {
                name: memberUser.name,
                id: memberUser.id,
                email: memberUser.email,
                is_user: memberUser.id === userId,
                student_id: {
                    uploaded: !(!memberUser.student_id_file_id),
                    status: studentIdStatus,
                    url: (studentIdFile) ? studentIdFile.url : undefined,
                    filename: (studentIdFile) ? studentIdFile.filename.split('/').pop() : undefined,
                },
                proof_of_enrollment: {
                    uploaded: !(!memberUser.poe_file_id),
                    status: proofOfEnrollmentStatus,
                    url: (proofOfEnrollmentFile) ? proofOfEnrollmentFile.url : undefined,
                    filename: (proofOfEnrollmentFile) ? proofOfEnrollmentFile.filename.split('/').pop() : undefined,
                }
            };

            teamMembers.push(member);
        }

        let proofOfPaymentFile;
        if(team.proof_of_payment_file_id) {
            proofOfPaymentFile = await filesRepository.get(team.proof_of_payment_file_id);
        }

        return {
            step: 1,
            data: {
                team_name: team.name,
                university: team.university,
                invite_code: team.invite_code,
                payment: {
                    uploaded: !(!team.proof_of_payment_file_id),
                    url: (proofOfPaymentFile) ? proofOfPaymentFile.url : undefined,
                    filename: (proofOfPaymentFile) ? proofOfPaymentFile.filename.split('/').pop() : undefined,
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

    async function deleteTeamAndItsResources(teamId) {
        const team = await getTeamById(teamId);

        if(!team) {
            throw "Team not exists";
        }

        const popFileId = team.proof_of_payment_file_id;

        if(popFileId) {
            const popFile = await filesRepository.get(popFileId);

            await deleteFile(popFile.filename);
            await filesRepository.delete(popFileId);
        }

        await deleteTeam(teamId);
    }

    function isProfileComplete(user) {
        return user.name && user.email && user.gender && user.mobile_no && user.university && user.major;
    }

    next();
};