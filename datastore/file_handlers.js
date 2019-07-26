let fileHandlers = {};

/**
 * Register new file handler
 * @param handlerName
 * @param callback
 */
export function register(handlerName, callback) {
    if(handlerName) {
        fileHandlers[handlerName] = callback;
    }
}

export function getHandler(handlerName) {
    return fileHandlers[handlerName];
}