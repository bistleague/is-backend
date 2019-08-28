import {getConfig} from "../../datastore/config";
import {ConfigKeys} from "../../model/Config";

const usersRepository = require('../../datastore/users');
const filesRepository = require('../../datastore/files');
const File = require('../../model/File');
const { upload, deleteFile } = require('../../datastore/file_storage');
const { getEligibleTeam } = require('./commons');

export async function stage_semifinalResultsAnnounced(user) {
    const team = await getEligibleTeam(user);
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
    const team = await getEligibleTeam(user);
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

    // Get case URL
    const caseUrl = await getConfig(ConfigKeys.SEMIFINAL_CASE_URL) || "http://example.com";

    return {
        step: 3,
        data: {
            qualified: team.semifinal_qualified === true,
            started: true,
            stage_closed: false,
            team_name: team.name,
            case_url: caseUrl,
            submission: {
                ...await getSemifinalSubmissionData(team),
                closed: false
            }
        }
    }
}

export async function stage_semifinalSubmissionDeadline(user) {
    const team = await getEligibleTeam(user);
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

    // Get case URL
    const caseUrl = await getConfig(ConfigKeys.SEMIFINAL_CASE_URL) || "http://example.com";

    return {
        step: 3,
        data: {
            qualified: team.semifinal_qualified === true,
            started: true,
            stage_closed: false,
            team_name: team.name,
            case_url: caseUrl,
            submission: {
                ...await getSemifinalSubmissionData(team),
                closed: true
            }
        }
    }
}

export async function stage_semifinalStageClosed(user) {
    const team = await getEligibleTeam(user);
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
    const fileId = team.semifinal_submission_file_id;

    if(!fileId) {
        return {uploaded: false};
    }

    const file = await filesRepository.get(fileId);
    const lastSubmitterUserId = team.semifinal_submission_user_id;
    const lastSubmitter = await usersRepository.get(lastSubmitterUserId);

    return {
        uploaded: true,
        file_url: file.url,
        filename: file.filename.split('/').pop(),
        last_submitted_by: lastSubmitter.name,
        last_submitted_at: team.semifinal_submission_last_submitted
    }
}
