/**
 * File object prototype
 * The File entity represents the individual file recorded in the system.
 *
 * @author Alfian Maulana Ibrahim
 */

function File(fileId, filename, url) {
    // Primary file attributes
    this.filename = filename;
    this.url = url;
    this.id = fileId;
}

module.exports = File;