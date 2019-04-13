/**
 * Users model abstraction
 */

const db = require('./datastore');
const bcrypt = require('bcrypt');

const ENTITY_NAME = 'User';
const HASH_SALT = 10;

exports.HASH_SALT = HASH_SALT;

/**
 * Get user by username
 */
exports.get = async function(username) {
    // TODO implement
};

/**
 * Add a user
 * @param user User object
 */
exports.add = async function(user) {
    // TODO implement
};

/**
 * Update a user by ID
 */
exports.update = async function(id, user) {
    // TODO implement
};

/**
 * Delete a user by ID
 */
exports.delete = async function(id) {
    // TODO implement
};

/**
 * Initialize users
 */
async function init() {
    let adminUsername = process.env.ADMIN_USERNAME;
    let adminPassword = process.env.ADMIN_PASSWORD;

    // Try to see if admin user exists
    try{
        let user = await exports.get(adminUsername);
        if(!user) {
            console.log(" [*] Creating Administrator user...");
            // Not exists, create one
            //await exports.add("Administrator", adminUsername, adminPassword);
            console.log(" [x] Administrator user created!");
        }
    }catch(err){
        console.error(err);
    }
}

init();