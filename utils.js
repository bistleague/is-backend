/**
 * Utils.js
 */

/**
 * Generate token
 * @param n length
 * @returns {string} token
 *
 * Source: https://stackoverflow.com/questions/8532406/create-a-random-token-in-javascript-based-on-user-details
 */
exports.generateToken = function(n) {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var token = '';
    for(var i = 0; i < n; i++) {
        token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
};