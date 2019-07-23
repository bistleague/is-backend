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

    if(!team.name || !team.university) {
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

    let dbTeam = getTeamById(teamId);

    if(!dbTeam) {
        throw "Team not found";
    }

    if(team.stage && !isStageValid(team.stage)) {
        throw "Team stage invalid";
    }

    if(team.name) dbTeam.name = team.name;
    if(team.university) dbTeam.university = team.university;
    if(team.stage) dbTeam.stage = team.stage;
    if(team.proof_of_payment_file_id) dbTeam.proof_of_payment_file_id = team.proof_of_payment_file_id;
    if(team.proof_of_payment_verified) dbTeam.proof_of_payment_verified = team.proof_of_payment_verified === true;

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

function isStageValid(stage) {
    return stage === TeamStage.STAGE_REGISTERED ||
        stage === TeamStage.STAGE_COMPLETED ||
        stage === TeamStage.STAGE_SUBMITTED_PRELIMINARY ||
        stage === TeamStage.STAGE_QUALIFIED_SEMIFINAL ||
        stage === TeamStage.STAGE_SUBMITTED_SEMIFINAL ||
        stage === TeamStage.STAGE_QUALIFIED_FINAL
}