const multerGoogleStorage = require("multer-google-storage");
const storageEngine = multerGoogleStorage.storageEngine({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_DATASTORE_CREDENTIALS_JSON_PATH,
    bucket: process.env.GCP_STORAGE_BUCKET_NAME
});

function BLStorageEngine() {}

BLStorageEngine.prototype._handleFile = function _handleFile (req, file, cb) {
    storageEngine._handleFile(req, file, cb);
};

BLStorageEngine.prototype._removeFile = function _removeFile (req, file, cb) {
    return storageEngine._removeFile(req, file, cb);
};

module.exports = function () {
    return new BLStorageEngine()
};