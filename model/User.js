/**
 * User object prototype
 * The User entity represents the individual user account recorded in the system.
 *
 * @author Muhammad Aditya Hilmy
 */

function User(name, email, passwordHash, options) {
    if (options === undefined) options = {};

    // Primary user attributes
    this.name = name;
    this.email = email;
    this.password_hash = passwordHash;
    this.is_admin = options.is_admin === true;
    this.email_verified = options.email_verified === true;

    // Optional profile attributes
    this.university = options.university || null;
    this.major = options.major || null;
    this.mobile_no = options.mobile_no || null;
    this.gender = options.gender || 0;

    // Competition-related attributes
    this.team_id = options.team_id || null;
    this.student_id_file_id = options.student_id_file_id || null;
    this.student_id_verified = options.student_id_verified || null;
    this.poe_file_id = options.poe_file_id || null;
    this.poe_verified = options.poe_verified || null;
}

User.MALE = 1;
User.FEMALE = 2;

module.exports = User;