/**
 * Email token object prototype
 * The EmailToken entity represents the email and token tuple for email verification link or password reset
 *
 * @author Muhammad Aditya Hilmy
 */

const Utils = require('../utils');

function EmailToken(email, expires, token) {
    this.email = email;
    this.expires = expires;
    this.token = token || Utils.generateToken(32);
}

module.exports = EmailToken;