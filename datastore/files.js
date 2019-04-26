/**
 * Files model abstraction
 */

const db = require('./datastore');

const ENTITY_NAME = 'File';

const File = require('../model/File');

/**
 * Get file by ID
 */
exports.get = async function(id) {
	// TODO implement

    if(!id) {
        return;
    }

    const key = db.key([ENTITY_NAME, id]);
    const file = await db.get(key);
    return file[0];
};

/**
 * Add a file
 * @param file File object
 */
exports.add = async function(file) {
	// TODO implement

    /*if(!user) {
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

    console.log(user);

    // Insert
    await db.insert(entity);*/
};

/**
 * Delete a file by Entity Key
 */
exports.delete = async function(id) {
    const key = db.key([ENTITY_NAME, id]);
    await db.delete(key);
};

/**
 * Initialize users
 */
async function init() {
    // Dunno what for
}

init();