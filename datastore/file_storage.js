const multer = require('fastify-multer');
const multerGoogleStorage = require('multer-google-storage');
const storageEngine = multerGoogleStorage.storageEngine({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_DATASTORE_CREDENTIALS_JSON_PATH,
    bucket: process.env.GCP_STORAGE_BUCKET_NAME
});
export const upload = multer({
    storage: storageEngine
});