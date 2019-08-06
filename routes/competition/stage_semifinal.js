const usersRepository = require('../../datastore/users');
const filesRepository = require('../../datastore/files');
const File = require('../../model/File');
const { upload, deleteFile } = require('../../datastore/file_storage');
const { userHasEligibleTeam } = require('./commons');

export async function stage_semifinalResultsAnnounced(user) {
    const team = await userHasEligibleTeam(user);
    if(!team) return { step: -1 };

    return {
        step: 3,
        data: {
            qualified: team.semifinal_qualified === true,
            started: false,
            stage_closed: false,
            team_name: team.name
        }
    }
}

export async function stage_semifinalCaseReleased(user) {
    const team = await userHasEligibleTeam(user);
    if(!team) return { step: -1 };

    if(!team.semifinal_qualified) {
        return {
            step: 3,
            data: {
                qualified: team.semifinal_qualified === true,
                started: false,
                stage_closed: false,
                team_name: team.name
            }
        }
    }

    return {
        step: 3,
        data: {
            qualified: team.semifinal_qualified === true,
            started: true,
            stage_closed: false,
            team_name: team.name,
            case_url: "http://files.bistleague.com/public/semifinal.pdf",
            submission: {
                ...await getSemifinalSubmissionData(team),
                closed: false
            }
        }
    }
}

export async function stage_semifinalSubmissionDeadline(user) {
    const team = await userHasEligibleTeam(user);
    if(!team) return { step: -1 };

    if(!team.semifinal_qualified) {
        return {
            step: 3,
            data: {
                qualified: team.semifinal_qualified === true,
                started: false,
                stage_closed: false,
                team_name: team.name
            }
        }
    }

    return {
        step: 3,
        data: {
            qualified: team.semifinal_qualified === true,
            started: true,
            stage_closed: false,
            team_name: team.name,
            case_url: "http://files.bistleague.com/public/semifinal.pdf",
            submission: {
                ...await getSemifinalSubmissionData(team),
                closed: true
            }
        }
    }
}

export async function stage_semifinalStageClosed(user) {
    const team = await userHasEligibleTeam(user);
    if(!team) return { step: -1 };

    if(!team.semifinal_qualified) {
        return {
            step: 3,
            data: {
                qualified: team.semifinal_qualified === true,
                started: false,
                stage_closed: false,
                team_name: team.name
            }
        }
    }

    return {
        step: 3,
        data: {
            qualified: team.semifinal_qualified === true,
            started: true,
            stage_closed: true,
            team_name: team.name,
        }
    }
}

async function getSemifinalSubmissionData(team) {
    return {
        uploaded: false,    // TODO change
        file_url: "http://files.bistleague.com/v/py/CASE.pptx", // TODO change
        filename: "CASE.pptx",  // TODO change
        last_submitted_by: "Muhammad Aditya Hilmy", // TODO change
        last_submitted_at: 1554785117000    // TODO change
    }
}
