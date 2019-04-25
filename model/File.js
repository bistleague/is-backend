/**
 * File object prototype
 * The File entity represents the individual file recorded in the system.
 *
 * @author Alfian Maulana Ibrahim
 */

function File(url, options) {
    if (options === undefined) options = {};

    // Primary file attributes
    this.filename = filename;
    this.url = url;
    this.key = key;
}

module.exports = File;