import {ConfigKeys} from "../../model/Config";
import {getConfig} from "../../datastore/config";

const usersRepository = require('../../datastore/users');
const filesRepository = require('../../datastore/files');
const File = require('../../model/File');
const { upload, deleteFile } = require('../../datastore/file_storage');
const { getEligibleTeam } = require('./commons');

export async function stage_preliminaryCaseReleased(user) {
    const team = await getEligibleTeam(user);
    if(!team) return { step: -1 };

    // Get case URL
    const caseUrl = await getConfig(ConfigKeys.PRELIMINARY_CASE_URL) || "http://example.com";

    return {
        step: 2,
        data: {
            started: true,
            stage_closed: false,
            team_name: team.name,
            case_url: caseUrl,
            submission: {
                ...await getPreliminarySubmissionData(team),
                closed: false,
            }
        }
    }
}

export async function stage_preliminarySubmissionDeadline(user) {
    const team = await getEligibleTeam(user);
    if(!team) return { step: -1 };

    // Get case URL
    const caseUrl = await getConfig(ConfigKeys.PRELIMINARY_CASE_URL) || "http://example.com";

    return {
        step: 2,
        data: {
            started: true,
            stage_closed: false,
            team_name: team.name,
            case_url: caseUrl,
            submission: {
                ...await getPreliminarySubmissionData(team),
                closed: true,
            }
        }
    }
}

export async function stage_preliminaryStageClosed(user) {
    const team = await getEligibleTeam(user);
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
    const fileId = team.preliminary_submission_file_id;

    if(!fileId) {
        return {uploaded: false};
    }

    const file = await filesRepository.get(fileId);
    const lastSubmitterUserId = team.preliminary_submission_user_id;
    const lastSubmitter = await usersRepository.get(lastSubmitterUserId);

    return {
        uploaded: true,
        file_url: file.url,
        filename: file.filename.split('/').pop(),
        last_submitted_by: lastSubmitter.name,
        last_submitted_at: team.preliminary_submission_last_submitted
    }
}