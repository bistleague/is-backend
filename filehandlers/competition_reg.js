const fileHandler = require('../datastore/file_handlers');

fileHandler.register('competition_registration_payment', async (req, reply, filename, fileId) => {
    console.log("File uploaded!", `userId: ${req.user.sub}, filename: ${filename}, fileId: ${fileId}`);
});