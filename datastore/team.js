/**
 * Team model abstraction
 */

import { Team, TeamStage } from "../model/Team";

const db = require('./datastore');
const uuidv4 = require('uuid/v4');

const ENTITY_NAME = 'Team';

export async function getTeamById(id) {
    if(!id) {
        return;
    }

    const key = db.key([ENTITY_NAME, id]);
    const team = await db.get(key);
    return team[0];
}

export async function saveTeam(team) {
    if(!team) {
        return;
    }

    // All is well
    const teamId = uuidv4();
    team.team_id = teamId;

    const entity = {
        key: db.key([ENTITY_NAME, teamId]),
        data: team
    };

    // Insert
    await db.insert(entity);
    return team;
}

export async function updateTeam(teamId, team) {
    if(!team) {
        throw "Team is empty";
    }

    let dbTeam = await getTeamById(teamId);

    if(!dbTeam) {
        throw "Team not found";
    }

    if(team.stage && !isStageValid(team.stage)) {
        throw "Team stage invalid";
    }

    if(team.name) {
        // Check team name exists
        const checkedTeam = await getTeamByName(team.name);
        if(checkedTeam) {
            if(checkedTeam.team_id !== teamId) {
                throw "Team name is taken";
            }
        }

        dbTeam.name = team.name;
    }

    if(team.university) dbTeam.university = team.university;
    if(team.stage) dbTeam.stage = team.stage;
    if(team.invite_code) dbTeam.invite_code = team.invite_code;
    if(team.proof_of_payment_file_id !== undefined) dbTeam.proof_of_payment_file_id = team.proof_of_payment_file_id;
    if(team.proof_of_payment_verified !== undefined) dbTeam.proof_of_payment_verified = team.proof_of_payment_verified === true;
    if(team.proof_of_payment_rejected !== undefined) dbTeam.proof_of_payment_rejected = team.proof_of_payment_rejected === true;

    if(team.preliminary_submission_file_id !== undefined) dbTeam.preliminary_submission_file_id = team.preliminary_submission_file_id;
    if(team.preliminary_submission_last_submitted !== undefined) dbTeam.preliminary_submission_last_submitted = team.preliminary_submission_last_submitted;
    if(team.preliminary_submission_user_id !== undefined) dbTeam.preliminary_submission_user_id = team.preliminary_submission_user_id;

    if(team.semifinal_submission_file_id !== undefined) dbTeam.semifinal_submission_file_id = team.semifinal_submission_file_id;
    if(team.semifinal_submission_last_submitted !== undefined) dbTeam.semifinal_submission_last_submitted = team.semifinal_submission_last_submitted;
    if(team.semifinal_submission_user_id !== undefined) dbTeam.semifinal_submission_user_id = team.semifinal_submission_user_id;

    const key = db.key([ENTITY_NAME, teamId]);

    const entity = {
        key: key,
        data: dbTeam,
    };

    await db.update(entity);
}

/**
 * Delete a Team by Entity Key
 */
export async function deleteTeam(id) {
    const key = db.key([ENTITY_NAME, id]);
    await db.delete(key);
}

export async function getTeamByInviteCode(inviteCode) {
    if(!inviteCode) {
        return null;
    }

    const query = db.createQuery(ENTITY_NAME)
        .filter('invite_code', '=', inviteCode);

    const [teams] = await db.runQuery(query);
    return teams[0];
}

export async function getTeamByName(teamName) {
    if(!teamName) return null;

    const query = db.createQuery(ENTITY_NAME)
        .filter('name', '=', teamName);

    const [teams] = await db.runQuery(query);
    return teams[0];
}

export async function getAllTeams() {
    const query = db.createQuery(ENTITY_NAME);

    const [teams] = await db.runQuery(query);
    return teams;
}

function isStageValid(stage) {
    return stage === TeamStage.STAGE_REGISTERED ||
        stage === TeamStage.STAGE_COMPLETED ||
        stage === TeamStage.STAGE_SUBMITTED_PRELIMINARY ||
        stage === TeamStage.STAGE_QUALIFIED_SEMIFINAL ||
        stage === TeamStage.STAGE_SUBMITTED_SEMIFINAL ||
        stage === TeamStage.STAGE_QUALIFIED_FINAL
}