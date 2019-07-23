/**
 * Main server
 * @author Muhammad Aditya Hilmy
 */

require("dotenv").config();
require("./datastore/config");

const fastify = require('fastify')({ logger: true });

fastify.register(require('fastify-multipart'));

fastify.register(require('fastify-jwt'), {
    secret: process.env.JWT_SECRET
});

fastify.register(require('fastify-cors'), {
    origin: true,
    methods: ['GET', 'PUT', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

require("./filehandlers/competition_reg");

// Register routes
fastify.register(require('./routes/auth'), { prefix: '/v1/auth' });
fastify.register(require('./routes/account'), { prefix: '/v1/account' });
fastify.register(require('./routes/user'), { prefix: '/v1/user', preValidation: [fastify.authenticate] });
fastify.register(require('./routes/competition'), { prefix: '/v1/competition', preValidation: [fastify.authenticate] });
fastify.register(require('./routes/file'), { prefix: '/v1/file', preValidation: [fastify.authenticate] });

// Run the server!
const start = async () => {
    try {
        await fastify.listen(process.env.PORT);
        fastify.log.info(`server listening on ${fastify.server.address().port}`)
    } catch (err) {
        fastify.log.error(err);
    }
};

start();