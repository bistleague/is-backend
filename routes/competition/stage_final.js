const usersRepository = require('../../datastore/users');
const filesRepository = require('../../datastore/files');
const File = require('../../model/File');
const { upload, deleteFile } = require('../../datastore/file_storage');
const { getEligibleTeam } = require('./commons');

export async function stage_finalResultsAnnounced(user) {
    const team = await getEligibleTeam(user);
    if(!team) return { step: -1 };

    if(!team.semifinal_qualified) {
        return {
            step: 3,
            data: {
                qualified: team.semifinal_qualified === true,
                started: false,
                stage_closed: false,
                team_name: team.name
            }
        }
    }

    return {
        step: 4,
        data: {
            qualified: team.final_qualified === true,
            started: false,
            stage_closed: false,
            team_name: team.name
        }
    }
}
