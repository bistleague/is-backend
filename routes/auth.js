
/**
 * Auth endpoints
 * Prefix: /v1/auth
 */
module.exports = function (fastify, opts, next) {
    /**
     * List identities belonging to a NIK
     */
    fastify.get('/login', async (req, reply) => {
        try {
            return {hello: 'world'};
        } catch (e) {
            reply.code(401);
            return {error: e.toString()}
        }
    });

    next();
};