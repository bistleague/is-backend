/**
 * File endpoints
 * Prefix: /v1/file
 */

const db = require('../datastore/datastore');
const filesRepository = require('../datastore/files');
const File = require('../model/File');
const fileHandlers = require('../datastore/file_handlers');
const {upload} = require('../datastore/file_storage');

module.exports = function (fastify, opts, next) {
    /**
     * Authentication hook
     */
    fastify.addHook('preHandler', function (req, reply) {
        return req.jwtVerify()
    });

    /**
     * Get stored file
     */
    // fastify.get('/', async (req, reply) => {
    //     try {
    //         // TODO implement
    //
    //         // Read login parameters
    //         // const fileId = req.sub.fileId;
    //
    //         // Get file by fileId
    //         let file = await filesRepository.get(fileId);
    //
    //         // Check if file exists
    //         if(!file) {
    //             reply.code(401);
    //             return {error: "Invalid file"};
    //         }
    //
    //         delete file[db.KEY];
    //
    //         return file;
    //     } catch (e) {
    //         reply.code(500);
    //         console.log(e);
    //         return {error: e.toString()}
    //     }
    // });

    /**
     * Store file to database
     */
    // fastify.put('/', async (req, reply) => {
    //     try {
    //         // TODO implement
    //
    //         const filename = req.body.filename;
    //         const url = req.body.url;
    //         // const key = req.body.key;
    //
    //         return {filename: filename};
    //     } catch (e) {
    //     	reply.code(500);
    //         console.log(e);
    //         return {error: e.toString()}
    //     }
    // });

    /**
     * Delete stored file
     */
    // fastify.delete('/', async (req, reply) => {
    //     try {
    //         // TODO implement
    //
    //     } catch (e) {
    //     	reply.code(500);
    //         console.log(e);
    //         return {error: e.toString()}
    //     }
    // });

    /**
     * Upload data
     * URL param: module: determine which module to call
     */
    fastify.route({
        method: 'POST',
        url: '/upload',
        preHandler: (req, reply, next) => {
            const handlerName = req.query.handler;
            if(!fileHandlerExists(handlerName)) {
                reply.code(404).send({success: false, error: 'File handler not found'});
            }

            return upload.single('file')(req, reply, next)
        },
        handler: async function(req, reply) {
            const handlerName = req.query.handler;
            const fileHandler = fileHandlers.getHandler(handlerName);
            const file = req.file;

            // Add to Database
            const dbFile = await filesRepository.add(new File('', file.filename, file.path));
            await fileHandler(req, reply, file.filename, dbFile.id);

            // request.file is the `avatar` file
            // request.body will hold the text fields, if there were any
            reply.code(200).send();
        }
    });

    next();

    function fileHandlerExists(handlerName) {
        const fileHandler = fileHandlers.getHandler(handlerName);
        return !!fileHandler;
    }
};