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
    this.proof_of_payment_rejected = false;
    this.invite_code = undefined;
    this.created_time = Date.now();

    // Preliminary submission
    this.preliminary_submission_file_id = undefined;
    this.preliminary_submission_user_id = undefined;
    this.preliminary_submission_last_submitted = undefined;

    // Semifinal submission
    this.semifinal_qualified = undefined;
    this.semifinal_submission_file_id = undefined;
    this.semifinal_submission_user_id = undefined;
    this.semifinal_submission_last_submitted = undefined;

    // Final qualification
    this.final_qualified = undefined;

    // Overrides
    this.registration_eligibility_override = false;
}