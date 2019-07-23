/**
 * Files model abstraction
 */

const File = require('../model/File');
const db = require('./datastore');
const ENTITY_NAME = 'File';

/**
 * Get file by ID
 */
exports.get = async function(id) {
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
    if(!file) {
        return;
    }

    const fileId = uuidv5(file.filename, uuidv5.DNS);
    file.id = fileId;

    const entity = {
        key: db.key([ENTITY_NAME, fileId]),
        data: file
    };

    console.log(file);

    // Insert
    await db.insert(entity);
    return file;
};

/**
 * Delete a file by Entity Key
 */
exports.delete = async function(id) {
    const key = db.key([ENTITY_NAME, id]);
    await db.delete(key);
};