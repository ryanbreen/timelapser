import { getRecords } from './sundial.js'
import { produceVideo } from './converter.js'

import _ from 'lodash'
import disk from 'diskusage'

import dateFormat from 'dateformat'
import log from 'single-line-log'

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
    weekAgo.setTime(weekAgo.getTime() - (8 * 24 * 60 * 60 * 1000))

    const files = _.filter(await ls("/pool/view_data"), file => {
        const fileTime = parseInt(file.substring(0, file.indexOf('png')))
        return fileTime <= weekAgo.getTime()
    })

    const { free, total } = await disk.check('/pool/view_data/');
    const gbUsed = (total - free) / 1024 / 1024 / 1024

    log.stdout(`${dateFormat(new Date(), 'mm-dd-yyyy HH:MM')}: Found ${files.length} old files to purge, working set is ${gbUsed.toFixed(2)}GiB`)

    for await(const file of files) {
        rm(`/pool/view_data/${file}`)
    }
}

export const tick = async () => {

    const today = new Date()
    const records = _.flatten(_.map(_.range(0, 7, 1), dateMath => {
        let day = new Date()
        day.setTime(today.getTime() - (dateMath * 24 * 60 * 60 * 1000))

        // Look for all files in the last week
        return getRecords(day)
    }))

    // Add in any custom records
    records.push({
        name: '07-05-2020_evening_fireworks',
        start: 1593984927143,
        end: 1594014087143
    })

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