/**
 * File endpoints
 * Prefix: /v1/file
 */

const db = require('../datastore/datastore');
const filesRepository = require('../datastore/files');
const File = require('../model/File');
const fileHandlers = require('../datastore/file_handlers');

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

    /**
     * Upload data
     * URL param: module: determine which module to call
     */
    fastify.post('/upload', async function (req, reply) {

        const handlerName = req.query.handler;
        const fileHandler = fileHandlers.getHandler(handlerName);

        if(!fileHandler) {
            reply.code(404);
            return {success: false};
        }

        const mp = req.multipart( async (field, file, filename, encoding, mimetype) => {
            console.log("Handler called!");
        }, function (err) {
            console.log('Upload completed');
            reply.code(200).send();
        });

        // mp.on('field', function (key, value) {
        //     console.log('form-data', key, value);
        // });

        function handler(field, file, filename, encoding, mimetype) {
            console.log('handlercalled');
            // TODO upload to Cloud Filestore
            const fileUrl = ''; // TODO from GCP
            const fileKey = ''; // TODO from GCP

            // Add to Database
            const dbFile = filesRepository.add(new File('', filename, fileUrl, fileKey));

            console.log('dbFile', dbFile);
            fileHandler(req, reply, filename, dbFile.id);
        }
    });

    next();
};