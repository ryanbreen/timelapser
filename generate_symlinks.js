const fs = require('fs')
const util = require('util')

const ln_s = util.promisify(fs.symlink)
const mkdir = util.promisify(fs.mkdir)
const readdir = util.promisify(fs.readdir)

// NOTE: Local time on machine is UTC

const suncalc = require('suncalc')

const today = new Date()
const yesterday = new Date()
yesterday.setDate(today.getDate() - 1)

const todaySun = suncalc.getTimes(today, 43.884054, -72.285053)
const yesterdaySun = suncalc.getTimes(yesterday, 43.884054, -72.285053)
const sunrise = todaySun.sunrise.getTime()
const sunset = todaySun.sunset.getTime()
const lastSunset = yesterdaySun.sunset.getTime()

const before = lastSunset
const after = sunrise

//const before = sunrise - 30 * 60 * 1000
//const after = sunset + 30 * 60 * 1000

//const before = sunrise - (30 * 60 * 1000)
//const after = sunrise + (180 * 60 * 1000)

//console.log('Sunrise today is %s, so looking for times between %s and %s', sunrise, before, after)

const collectAllFiles = async () => {

    try {
        await mkdir('/pool/view_data/temp')
    } catch(e) {
        
    }

    const files = await readdir("/pool/view_data")
    
    files.forEach(async(file) => {
        const fileTime = parseInt(file.substring(0, file.indexOf('png')))
        if (before <= fileTime && fileTime <= after) {
            try {
                await ln_s(`/pool/view_data/${file}`, `/pool/view_data/temp/${file}`)
            } catch(e) {

            }
        }
    })
}

const makeSunsetMovies = async() => {
    await collectAllFiles()
}

makeSunsetMovies()
