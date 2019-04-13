/**
 * User object prototype
 * The User entity represents the individual user account recorded in the system.
 *
 * @author Muhammad Aditya Hilmy
 */

function User(name, email, options) {
    if (options === undefined) options = {};

    this.name = name;
    this.email = email;
    this.id = options.id;
    this.password_hash = options.password_hash;
    this.university = options.university;
    this.major = options.major;
    this.mobile_no = options.mobile_no;
    this.gender = options.gender;
    this.is_admin = options.is_admin === true;
}

User.MALE = "male";
User.FEMALE = "female";

module.exports = User;