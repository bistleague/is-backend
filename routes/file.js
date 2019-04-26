/**
 * File endpoints
 * Prefix: /v1/file
 */

const db = require('../datastore/datastore');
const filesRepository = require('../datastore/files');
const File = require('../model/File');

module.exports = function (fastify, opts, next) {
    /**
     * Get stored file
     */
    fastify.get('/', async (req, reply) => {
        try {
            // TODO implement

            // Read login parameters
            // const fileId = req.sub.fileId;

            // Get file by fileId
            let file = await filesRepository.get(fileId);

            // Check if file exists
            if(!file) {
                reply.code(401);
                return {error: "Invalid file"};
            }

            delete file[db.KEY];

            return file;
        } catch (e) {
            reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Store file to database
     */
    fastify.put('/', async (req, reply) => {
        try {
            // TODO implement

            const filename = req.body.filename;
            const url = req.body.url;
            // const key = req.body.key;

            return {filename: filename};
        } catch (e) {
        	reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    /**
     * Delete stored file
     */
    fastify.delete('/', async (req, reply) => {
        try {
            // TODO implement

        } catch (e) {
        	reply.code(500);
            console.log(e);
            return {error: e.toString()}
        }
    });

    next();
};