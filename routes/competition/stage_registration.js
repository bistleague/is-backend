const usersRepository = require('../../datastore/users');
const filesRepository = require('../../datastore/files');
const File = require('../../model/File');
const { upload, deleteFile } = require('../../datastore/file_storage');
const { getEligibleTeam } = require('./commons');
const { getTeamById } = require('../../datastore/team');

export async function stage_registrationOpened(user) {
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
                status: getPaymentStatus(team)
            },
            team_members: teamMembers
        }
    }
}

function getPaymentStatus(team) {
    if (team.proof_of_payment_verified) {
        return "VERIFIED";
    } else {
        if(team.proof_of_payment_rejected) {
            return "REJECTED";
        } else {
            return "PENDING";
        }
    }
}

export async function stage_registrationClosed(user) {
    const team = await getEligibleTeam(user);
    if(!team) return { step: -1 };

    return {
        step: 2,
        data: {
            started: false,
            team_name: team.name
        }
    }
}

function isProfileComplete(user) {
    return user.name && user.email && user.gender && user.mobile_no && user.university && user.major;
}