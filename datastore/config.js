/**
 * Config model abstraction
 */

const { Config, ConfigKeys } = require("../model/Config");
const { CompetitionStage } = require("../model/CompetitionStage");

const db = require('./datastore');

const ENTITY_NAME = 'Config';

export async function getConfig(configKey) {
    if(!configKey) {
        return;
    }

    const key = db.key([ENTITY_NAME, configKey]);
    const config = await db.get(key);
    return (config[0]) ? config[0].value : null;
}

export async function saveConfig(configKey, configValue) {
    if(!configKey || configValue === undefined) {
        return;
    }

    const entity = {
        key: db.key([ENTITY_NAME, configKey]),
        data: {
            value: configValue
        }
    };

    // Insert
    await db.upsert(entity);
    return configValue;
}

/**
 * Delete a Team by Entity Key
 */
export async function deleteConfig(configKey) {
    const key = db.key([ENTITY_NAME, configKey]);
    await db.delete(key);
}

async function init() {
    const stageConfig = await getConfig(ConfigKeys.COMPETITION_STAGE);
    if(stageConfig === null || stageConfig === undefined) {
        console.log(" [*] Competition stage config not exists, creating...");
        await saveConfig(ConfigKeys.COMPETITION_STAGE, CompetitionStage.REGISTRATION_OPENED);
        console.log(" [*] Competition stage created!");
    }
}

init();