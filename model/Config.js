/**
 * Config object prototype
 *
 * @author Muhammad Aditya Hilmy
 */

export const ConfigKeys = {
    COMPETITION_STAGE: "COMPETITION_STAGE",
    PRELIMINARY_CASE_URL: "PRELIMINARY_CASE_URL",
    SEMIFINAL_CASE_URL: "SEMIFINAL_CASE_URL"
};


export function Config(key, value) {
    this.key = key;
    this.value = value;
}