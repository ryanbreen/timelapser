const { spawn } = require('child_process');
const fs = require('fs')
const util = require('util')

const _ = require('lodash')

const ln_s = util.promisify(fs.symlink)
const mkdir = util.promisify(fs.mkdir)
const rmdir = util.promisify(fs.rmdir)
const rm = util.promisify(fs.unlink)
const readdir = util.promisify(fs.readdir)

// NOTE: Local time on machine is UTC

const progress = require('progress')
const suncalc = require('suncalc')

const today = new Date()
//backup N days
//today.setDate(today.getDate()-2)
const yesterday = new Date()
yesterday.setDate(today.getDate() - 1)

const todaySun = suncalc.getTimes(today, 43.884054, -72.285053)
const yesterdaySun = suncalc.getTimes(yesterday, 43.884054, -72.285053)
const sunrise = todaySun.sunrise.getTime()
const sunset = todaySun.sunset.getTime()
const lastSunrise = yesterdaySun.sunrise.getTime()
const lastSunset = yesterdaySun.sunset.getTime()

//const before = lastSunset
//const after = sunrise

//const before = sunrise - 30 * 60 * 1000
//const after = sunset + 30 * 60 * 1000

//const before = todaySun.solarNoon.getTime()
//const after = sunset + 60 * 60 * 1000

const before = sunrise - (240 * 60 * 1000)
const after = sunrise + (180 * 60 * 1000)

const purgeOldFiles = async () => {
    const weekAgo = new Date()
    weekAgo.setDate(today.getDate() - 7)

    const weekAgoSun = suncalc.getTimes(weekAgo, 43.884054, -72.285053)

    const files = _.filter(await readdir("/pool/view_data"), file => {
        const fileTime = parseInt(file.substring(0, file.indexOf('png')))
        return fileTime <= weekAgoSun.sunrise.getTime()
    })

    console.log("Found %s old files to purge", files.length)
    files.forEach(async(file) => {
        try {
            await rm(`/pool/view_data/${file}`)
        } catch(e) {
        }
    })
}

const collectAllFiles = async () => {

    try {
        await rmdir('/pool/view_data/temp', { recursive: true })
        await mkdir('/pool/view_data/temp')
    } catch(e) {
        console.log("Failed to generate temp dir")
        process.exit(1)
    }

    const files = _.filter(await readdir("/pool/view_data"), file => {
        const fileTime = parseInt(file.substring(0, file.indexOf('png')))
        return before <= fileTime && fileTime <= after
    })

    console.log("Found %s files between %s and %s", files.length, new Date(before), new Date(after))
    
    for await(file of files) {
        try {
            await ln_s(`/pool/view_data/${file}`, `/pool/view_data/temp/${file}`)
        } catch(e) {
        }
    }

    return files.length
}

const produceVideo = async (frames, name) => {
    
    const produce = spawn('ffmpeg', ['-r','60','-pattern_type','glob','-i','*.png',`${name}.mp4`], { cwd: '/pool/view_data/temp/' })

    let frameCounter = 0

    const bar = new progress('  Converting [:bar] :percent :etas', { total: frames });

    produce.stderr.on('data', data => {
        const datar = data.toString()
        
        const match = datar.match(/frame=\s*([\d]*)\s*fps/)
        if (match && match.length > 0) {
            const frame = parseInt(match[1])
            bar.update(frame / frames)
        }
    });

    const exitCode = await new Promise( (resolve, reject) => {
        produce.on('close', resolve);
    });

    console.log('FFMPEg completed with %s', exitCode)
}

const run = async() => {
    // await purgeOldFiles()

    const frames = await collectAllFiles()
    await produceVideo(frames, "early_morning")
}

run()
