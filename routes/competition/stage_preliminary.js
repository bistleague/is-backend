const usersRepository = require('../../datastore/users');
const filesRepository = require('../../datastore/files');
const File = require('../../model/File');
const { upload, deleteFile } = require('../../datastore/file_storage');
const { userHasEligibleTeam } = require('./commons');

export async function stage_preliminaryCaseReleased(user) {
    const team = await userHasEligibleTeam(user);
    if(!team) return { step: -1 };

    return {
        step: 2,
        data: {
            started: true,
            stage_closed: false,
            team_name: team.name,
            case_url: "http://files.bistleague.com/public/preliminary.pdf",
            submission: {
                ...await getPreliminarySubmissionData(),
                closed: false,
            }
        }
    }
}

export async function stage_preliminarySubmissionDeadline(user) {
    const team = await userHasEligibleTeam(user);
    if(!team) return { step: -1 };

    return {
        step: 2,
        data: {
            started: true,
            stage_closed: false,
            team_name: team.name,
            case_url: "http://files.bistleague.com/public/preliminary.pdf",
            submission: {
                ...await getPreliminarySubmissionData(team),
                closed: true,
            }
        }
    }
}

export async function stage_preliminaryStageClosed(user) {
    const team = await userHasEligibleTeam(user);
    if(!team) return { step: -1 };

    return {
        step: 2,
        data: {
            started: true,
            stage_closed: true,
            team_name: team.name,
        }
    }
}

async function getPreliminarySubmissionData(team) {
    return {
        uploaded: false,    // TODO change
        file_url: "http://files.bistleague.com/v/py/CASE.pptx", // TODO change
        filename: "CASE.pptx",  // TODO change
        last_submitted_by: "Muhammad Aditya Hilmy", // TODO change
        last_submitted_at: 1554785117000    // TODO change
    }
}