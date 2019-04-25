/**
 * Main server
 * @author Muhammad Aditya Hilmy
 */

require("dotenv").config();

const fastify = require('fastify')({ logger: true });

fastify.register(require('fastify-jwt'), {
    secret: process.env.JWT_SECRET
});

fastify.register(require('fastify-cors'), {
    origin: true,
    methods: ['GET', 'PUT', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

// Register routes
fastify.register(require('./routes/auth'), { prefix: '/v1/auth' });
fastify.register(require('./routes/account'), { prefix: '/v1/account' });
fastify.register(require('./routes/user'), { prefix: '/v1/user', preValidation: [fastify.authenticate] });

// Run the server!
const start = async () => {
    try {
        await fastify.listen(3000);
        fastify.log.info(`server listening on ${fastify.server.address().port}`)
    } catch (err) {
        fastify.log.error(err);
    }
};

start();