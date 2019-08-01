/**
 * Team object prototype
 * The Team entity represents the team registered in the competition
 *
 * @author Muhammad Aditya Hilmy
 */
export const TeamStage = {
    STAGE_REGISTERED: 0,
    STAGE_COMPLETED: 1,
    STAGE_SUBMITTED_PRELIMINARY: 2,
    STAGE_QUALIFIED_SEMIFINAL: 3,
    STAGE_SUBMITTED_SEMIFINAL: 4,
    STAGE_QUALIFIED_FINAL: 5
};

export function Team() {
    this.team_id = undefined;
    this.name = undefined;
    this.university = undefined;
    this.stage = TeamStage.STAGE_REGISTERED;
    this.proof_of_payment_file_id = undefined;
    this.proof_of_payment_verified = false;
    this.invite_code = undefined;
    this.created_time = Date.now();
}