import _ from 'lodash'
import { spawn } from 'child_process'
import progress from 'progress'

import { readdir  } from 'fs'
import util from 'util'

import moment from 'moment'

import dateFormat from 'dateformat'

const readdirf = util.promisify(readdir)

const collectAllFiles = async () => {
    const files = await readdirf("/home/wrb/fun/code/timelapser/fall2021")
    return files.length
}

const callFFMPEG = async (frames, name, fps) => {

    const start = moment()
        
    const produce = spawn('ffmpeg', ['-r', '12','-pattern_type','glob','-i','*.png', '-c:v', 'libx265', '-preset', 'slow', '-crf', '26', '-x265-params', 'profile=main10', '-pix_fmt', 'yuv420p10le', `../processed/${name}.mp4`], { cwd: '/home/wrb/fun/code/timelapser/fall2021/' })

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

    const finish = moment()
    console.log(`${dateFormat(new Date(), 'mm-dd-yyyy HH:MM')}: Finished processing in ${finish.diff(start, 'minutes')} minutes`)
}

export const produceVideo = async (record) => {
    try {
        const frames = await collectAllFiles(record)
        if (frames > 0) {
           await callFFMPEG(frames, 'fall 2021')
        }
    } catch(e) {
        console.log(e)
    }
}

await produceVideo()
