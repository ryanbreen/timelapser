import { getGoldenHourMargin } from './sundial.js'
import { produceVideo } from './converter.js'

import _ from 'lodash'

import dateFormat from 'dateformat'
import log from 'single-line-log'

import { stat, readdir, copyFile, mkdir } from 'fs'
import util from 'util'

const ls = util.promisify(readdir)
const cp = util.promisify(copyFile)

const collectAllFiles = async (record) => {

    const files = _.filter(await ls("/pool/view_data"), file => {
        const fileTime = parseInt(file.substring(0, file.indexOf('png')))
        return record.start <= fileTime && fileTime <= record.end
    })

    if (files.length > 0) {
        console.log(`\n${dateFormat(new Date(), 'mm-dd-yyyy HH:MM')}: Found ${files.length} files between ${dateFormat(new Date(record.start), 'mm-dd-yyyy HH:MM')} and ${dateFormat(new Date(record.end), 'mm-dd-yyyy HH:MM')}`)
    }

    for await(const file of files) {
        try {
            await cp(`/pool/view_data/${file}`, `/home/wrb/fun/code/timelapser/fall2021/${file}`)
        } catch(e) {
        }
    }

    return files.length
}

export const tick = async () => {

    const today = new Date()
    _.map(_.range(0, 7, 1), dateMath => {
        let day = new Date()
        day.setTime(today.getTime() - (dateMath * 24 * 60 * 60 * 1000))

        // Look for all files in the last week
        const record = getGoldenHourMargin(day)
        collectAllFiles(record)
    })

    setTimeout(tick, 60*60*1000)
}

try {
    tick()
} catch(e) {
    console.log(e)
}