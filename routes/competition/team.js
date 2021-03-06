
const { saveTeam, updateTeam, getTeamById, getTeamByInviteCode, getTeamByName, deleteTeam } = require("../../datastore/team");
const { DocumentStatus } = require("../../model/DocumentStatus");
const { Team, TeamStage } = require("../../model/Team");
const { generateInviteCode } = require("../../helper");
const usersRepository = require('../../datastore/users');
const filesRepository = require('../../datastore/files');
const File = require('../../model/File');
const { upload, deleteFile } = require('../../datastore/file_storage');
const { CompetitionStage, AllowedSubmissionStages, AllowedSubmissionEditStages } = require("../../model/CompetitionStage");

module.exports = function (fastify) {
    fastify.post('/team', async (req, reply) => {
        try {
            const userId = req.user.sub;
            const teamName = req.body.name;
            const university = req.body.university;

            if(!teamName || !university) {
                reply.code(400);
                return {error: "Team name and university cannot be empty"};
            }

            let user = await usersRepository.get(userId);
            if(!user) {
                reply.code(401);
                return {error: "Invalid user"};
            }

            if(user.team_id) {
                reply.code(400);
                return {error: "User already has a team"};
            }

            // Check team name exists
            const checkedTeam = await getTeamByName(teamName);
            if(checkedTeam) {
                reply.code(400);
                return {error: "Team name is taken"};
            }

            const team = {
                stage: TeamStage.STAGE_REGISTERED,
                invite_code: await findUniqueInviteCode(),
                created_time: Date.now(),
                name: teamName,
                university: university
            };

            const savedTeam = await saveTeam(team);

            user.team_id = savedTeam.team_id;
            await usersRepository.update(user);

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
            await usersRepository.update(user);

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
            await usersRepository.update(targetUser);

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
            const dbFile = await filesRepository.add(new File('', file.filename, url, Date.now()));

            await updateTeam(teamId, {
                proof_of_payment_file_id: dbFile.id,
                proof_of_payment_verified: false,
                proof_of_payment_rejected: false
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
            const dbFile = await filesRepository.add(new File('', file.filename, url, Date.now()));

            targetUser.student_id_file_id = dbFile.id;
            targetUser.student_id_status = DocumentStatus.PENDING;
            await usersRepository.update(targetUser);

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

            await usersRepository.update(targetUser);

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
            const dbFile = await filesRepository.add(new File('', file.filename, url, Date.now()));

            targetUser.poe_file_id = dbFile.id;
            targetUser.poe_status = DocumentStatus.PENDING;
            await usersRepository.update(targetUser);

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

            await usersRepository.update(targetUser);

            reply.code(200).send({success: true});
        }
    });

    fastify.route({
        method: 'POST',
        url: '/team/submission',
        preHandler: upload.single('file'),
        handler: async function(req, reply) {
            const stage = req.competition_stage;

            if(!AllowedSubmissionStages.includes(stage)) {
                reply.code(401);
                return {error: "Submission is not allowed"};
            }

            const userId = req.user.sub;
            const user = await usersRepository.get(userId);
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
            if(!team) {
                reply.code(404);
                return {error: "Team not found"};
            }

            const file = req.file;

            // Add to Database
            const url = `${process.env.GCP_STORAGE_BASE_URL}/${file.filename}`;
            const dbFile = await filesRepository.add(new File('', file.filename, url, Date.now()));

            // Update team
            switch (stage) {
                case CompetitionStage.PRELIMINARY_CASE_RELEASED:
                case CompetitionStage.PRELIMINARY_SUBMISSION_DEADLINE:
                    if(team.preliminary_submission_file_id) {
                        reply.code(400);
                        return {error: "Submission is already submitted"};
                    }

                    await updateTeam(teamId, {
                        preliminary_submission_file_id: dbFile.id,
                        preliminary_submission_last_submitted: Date.now(),
                        preliminary_submission_user_id: userId
                    });
                    break;
                case CompetitionStage.SEMIFINAL_CASE_RELEASED:
                case CompetitionStage.SEMIFINAL_SUBMISSION_DEADLINE:
                    if(team.semifinal_submission_file_id) {
                        reply.code(400);
                        return {error: "Submission is already submitted"};
                    }

                    await updateTeam(teamId, {
                        semifinal_submission_file_id: dbFile.id,
                        semifinal_submission_last_submitted: Date.now(),
                        semifinal_submission_user_id: userId
                    });
                    break;
            }

            reply.code(200).send();
        }
    });

    fastify.route({
        method: 'DELETE',
        url: '/team/submission',
        handler: async function(req, reply) {
            const stage = req.competition_stage;

            if(!AllowedSubmissionEditStages.includes(stage)) {
                reply.code(401);
                return {error: "Submission deletion is not allowed"};
            }

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

            const team = await getTeamById(teamId);
            if(!team) {
                reply.code(404);
                return {error: "Team not found"};
            }

            const fileId = stage === CompetitionStage.PRELIMINARY_CASE_RELEASED
                ? team.preliminary_submission_file_id
                : team.semifinal_submission_file_id;

            if(!fileId) {
                reply.code(400);
                return {error: "Submission is not yet uploaded"};
            }

            const file = await filesRepository.get(fileId);
            deleteFile(file.filename);

            await filesRepository.delete(fileId);

            if(stage === CompetitionStage.PRELIMINARY_CASE_RELEASED) {
                await updateTeam(teamId, {
                    preliminary_submission_file_id: null
                });
            } else {
                await updateTeam(teamId, {
                    semifinal_submission_file_id: null
                });
            }

            reply.code(200).send({success: true});
        }
    });

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
};