/**
 * Config object prototype
 *
 * @author Muhammad Aditya Hilmy
 */

export const ConfigKeys = {
    COMPETITION_STAGE: "COMPETITION_STAGE"
};


export function Config(key, value) {
    this.key = key;
    this.value = value;
}