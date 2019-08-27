/**
 * Users model abstraction
 */

const db = require('./datastore');
const bcrypt = require('bcrypt');
const uuidv5 = require('uuid/v5');

const ENTITY_NAME = 'User';
const HASH_SALT = 10;

exports.HASH_SALT = HASH_SALT;

const User = require('../model/User');

/**
 * Get user by email
 */
exports.getByEmail = async function(email) {
    if(!email) {
        return;
    }

    const query = db.createQuery(ENTITY_NAME)
        .filter('email', '=', email)
        .limit(1);

    const [users] = await db.runQuery(query);
    let user = users[0];

    return user;
};

/**
 * Get user by Team ID
 */
exports.getByTeamId = async function(teamId) {
    if(!teamId) {
        return [];
    }

    const query = db.createQuery(ENTITY_NAME)
        .filter('team_id', '=', teamId);

    const [users] = await db.runQuery(query);
    return users;
};

/**
 * Get user by ID
 */
exports.get = async function(id) {
    if(!id) {
        return;
    }

    const key = db.key([ENTITY_NAME, id]);
    const user = await db.get(key);
    return user[0];
};

/**
 * Add a user
 * @param user User object
 */
exports.add = async function(user) {
    if(!user) {
        return;
    }

    let email = user.email;
    if(!email) throw "Invalid user object";

    // Check if user with the same email exists
    let checkUser = await exports.getByEmail(email);

    if(checkUser) {
        // User exists, throw exception
        throw "User with such email exists";
    }

    // All is well
    const userId = uuidv5(email, uuidv5.DNS);
    user.id = userId;

    const entity = {
        key: db.key([ENTITY_NAME, userId]),
        data: user
    };

    // Insert
    await db.insert(entity);
};

/**
 * Update a user by userId
 */
exports.update = async function(user) {
    // Prevent email duplicate
    const email = user.email;
    if(!email || !user.id) throw "Invalid user object";

    // Check if user with the same email exists
    let checkUser = await exports.getByEmail(email);

    // If user exists AND the ID is not the same, throw
    if(checkUser && user.id !== checkUser.id) {
        // User exists, throw exception
        throw "User with such email exists";
    }

    const key = db.key([ENTITY_NAME, user.id]);

    const entity = {
        key: key,
        data: user,
    };

    await db.update(entity);
};

/**
 * Delete a user by Entity Key
 */
exports.delete = async function(id) {
    const key = db.key([ENTITY_NAME, id]);
    await db.delete(key);
};

/**
 * Initialize users
 */
async function init() {
    let adminUsername = process.env.ADMIN_USERNAME;
    let adminPassword = process.env.ADMIN_PASSWORD;

    if(adminUsername && adminPassword) {
        // Try to see if admin user exists
        try{
            let user = await exports.getByEmail(adminUsername);
            if(!user) {
                console.log(" [*] Creating Administrator user...");
                // Not exists, create one
                const passwordHash = await bcrypt.hash(adminPassword, HASH_SALT);
                const user = new User("Administrator", adminUsername, passwordHash, {
                    is_admin: true,
                    email_verified: true
                });

                await exports.add(user);

                console.log(" [x] Administrator user created!");
            } else {
                console.log(" [x] Administrator user exists");
            }
        } catch(err) {
            console.error(err);
        }
    }
}

init();