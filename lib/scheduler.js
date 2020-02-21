import { getRecords } from './sundial.js'
import { produceVideo } from './converter.js'

import _ from 'lodash'

import { stat, readdir, unlink } from 'fs'
import util from 'util'

const exists = util.promisify(stat)
const ls = util.promisify(readdir)
const rm = util.promisify(unlink)

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

const purgeOldFiles = async () => {

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 8)

    const files = _.filter(await ls("/pool/view_data"), file => {
        const fileTime = parseInt(file.substring(0, file.indexOf('png')))
        return fileTime <= weekAgo.getTime()
    })

    console.log("Found %s old files to purge", files.length)
    for await(const file of files) {
        rm(`/pool/view_data/${file}`)
    }
}

export const tick = async () => {

    const today = new Date()
    const records = _.flatten(_.map(_.range(0, 7, 1), dateMath => {
        let day = new Date()
        day.setDate(today.getDate()-dateMath)

        // Look for all files in the last week
        return getRecords(day)
    }))

    for (const record of records) {
        await processRecord(record)
    }

    await purgeOldFiles()

    setTimeout(tick, 1*60*1000)
}

try {
    tick()
} catch(e) {
    console.log(e)
}