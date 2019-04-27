/**
 * Email verification token model abstraction
 */

const db = require('./datastore');

const ENTITY_NAME = 'EmailVerifyToken';
const EmailToken = require('../model/EmailToken');
const tokenExpiresSecs = 3600;

/**
 * Get token by email
 */
exports.get = async function(email) {
    if(!email) {
        return;
    }

    const current = Math.round((new Date()).getTime() / 1000);

    const key = db.key([ENTITY_NAME, email]);
    const tokens = await db.get(key);
    let token = tokens[0];

    if(!token) {
        return;
    }

    if(token.expires < current) {
        // Token expired, return error and delete
        await exports.invalidate(email);
        return;
    }

    return token;
};

/**
 * Generate token for email
 */
exports.generate = async function(email) {
    if(!email) {
        return;
    }

    const current = Math.round((new Date()).getTime() / 1000);
    let token = new EmailToken(email, current + tokenExpiresSecs);

    // Persist to database
    const entity = {
        key: db.key([ENTITY_NAME, email]),
        data: token
    };

    // Insert
    await db.upsert(entity);

    return token;
};

/**
 * Invalidate token by email
 */
exports.invalidate = async function(email) {
    if(!email) {
        return;
    }

    const key = db.key([ENTITY_NAME, email]);
    await db.delete(key);
};