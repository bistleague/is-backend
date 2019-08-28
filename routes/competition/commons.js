const { getTeamById } = require("../../datastore/team");

export async function getEligibleTeam(user) {
    // Get team
    const teamId = user.team_id;

    if(!teamId) {
        return null;
    }

    const team = await getTeamById(teamId);
    return isTeamDataComplete(team) ? team : null;
}

export function isTeamDataComplete(team) {
    if (team.registration_eligibility_override) {
        return true;
    }

    return team.proof_of_payment_file_id && team.name && team.university;
}