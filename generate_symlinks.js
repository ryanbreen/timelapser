const fs = require('fs')
const util = require('util')

const ln_s = util.promisify(fs.symlink)
const mkdir = util.promisify(fs.mkdir)
const readdir = util.promisify(fs.readdir)

// NOTE: Local time on machine is UTC
const sunrise = Date.parse('2020-02-03 12:04:00 GMT')

const before = sunrise - (30 * 60 * 1000)
const after = sunrise + (180 * 60 * 1000)

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