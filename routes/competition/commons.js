const { getTeamById } = require("../../datastore/team");

export async function userHasEligibleTeam(user) {
    // Get team
    const teamId = user.team_id;

    if(!teamId) {
        return null;
    }

    const team = await getTeamById(teamId);
    return isTeamDataComplete(team) ? team : null;
}

export function isTeamDataComplete(team) {
    return team.proof_of_payment_file_id && team.name && team.university;
}