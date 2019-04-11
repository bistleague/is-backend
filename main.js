/**
 * Main server
 * @author Muhammad Aditya Hilmy
 */

const fastify = require('fastify')({ logger: true });

// Register routes
fastify.register(require('./routes/auth'), { prefix: '/v1/auth' });


// Run the server!
const start = async () => {
    try {
        await fastify.listen(3000);
        fastify.log.info(`server listening on ${fastify.server.address().port}`)
    } catch (err) {
        fastify.log.error(err);
        process.exit(1)
    }
};

start();