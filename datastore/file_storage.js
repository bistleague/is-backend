const uuid = require('uuid/v4');
const multer = require('fastify-multer');
const multerGoogleStorage = require('multer-google-storage');
const storageEngine = multerGoogleStorage.storageEngine({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_DATASTORE_CREDENTIALS_JSON_PATH,
    bucket: process.env.GCP_STORAGE_BUCKET_NAME,
    filename(req, file, cb) {
        cb(null,`${uuid()}/${file.originalname}`);
    }
});
export const upload = multer({
    storage: storageEngine
});

export function deleteFile(filename) {
    storageEngine._removeFile(null, {
        filename
    });
}