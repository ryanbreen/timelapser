import { getRecords } from './sundial.js'
import { produceVideo } from './converter.js'

import { stat } from 'fs'
import util from 'util'

const exists = util.promisify(stat)

const processRecord = async(record) => {
    // Look for file
    try {
        const details = await exists(`./processed/${record.name}.mp4`)
    } catch(e) {
        // The file doesn't exist.  Check whether we're ready to create it.
        const time = new Date().getTime()
        if (time > record.end) {
            await produceVideo(record)
        }
    }
}

export const tick = async () => {

    // Look for all files in the last week
    const today = getRecords(new Date())
    for (const record of today) {
        await processRecord(record)
    }

    // Queue any that aren't built yet

    // Purge any files older than a week

}

tick()