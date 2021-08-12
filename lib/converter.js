
import { spawn } from 'child_process'
import progress from 'progress'

import moment from 'moment'

import dateFormat from 'dateformat'
import log from 'single-line-log'

import { readdir, rm, mkdir, symlink } from 'fs'
import util from 'util'

import _ from 'lodash'

const ln_s = util.promisify(symlink)
const mkdirf = util.promisify(mkdir)
const readdirf = util.promisify(readdir)
const rmdirf = util.promisify(rm)

const collectAllFiles = async (record) => {

    try {
        await rmdirf('/pool/view_data/temp', { recursive: true })
        await mkdirf('/pool/view_data/temp')
    } catch(e) {
        console.log("Failed to generate temp dir")
        process.exit(1)
    }

    const files = _.filter(await readdirf("/pool/view_data"), file => {
        const fileTime = parseInt(file.substring(0, file.indexOf('png')))
        return record.start <= fileTime && fileTime <= record.end
    })

    if (files.length > 0) {
        console.log(`\n${dateFormat(new Date(), 'mm-dd-yyyy HH:MM')}: Found ${files.length} files between ${dateFormat(new Date(record.start), 'mm-dd-yyyy HH:MM')} and ${dateFormat(new Date(record.end), 'mm-dd-yyyy HH:MM')} for ${record.name}`)
    }

    for await(const file of files) {
        try {
            await ln_s(`/pool/view_data/${file}`, `/pool/view_data/temp/${file}`)
        } catch(e) {
        }
    }

    return files.length
}

const callFFMPEG = async (frames, name, fps) => {

    const start = moment()
        
//    const produce = spawn('ffmpeg', ['-r','60','-pattern_type','glob','-i','*.png', '-c:v', 'libx265', '-preset', 'slower', '-crf', '24', '-pix_fmt', 'yuv420p10le', `../processed/${name}.mp4`], { cwd: '/pool/view_data/temp/' })
    const produce = spawn('ffmpeg', ['-r',fps ? fps : '120','-pattern_type','glob','-i','*.png', '-c:v', 'libx265', '-preset', 'slow', '-crf', '26', '-x265-params', 'profile=main10', '-pix_fmt', 'yuv420p10le', `../processed/${name}.mp4`], { cwd: '/pool/view_data/temp/' })

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

    const finish = moment()
    console.log(`${dateFormat(new Date(), 'mm-dd-yyyy HH:MM')}: Finished processing in ${finish.diff(start, 'minutes')} minutes`)
}

export const produceVideo = async (record) => {
    try {
        const frames = await collectAllFiles(record)
        if (frames > 0) {
           await callFFMPEG(frames, record.name, record.fps)
        }
    } catch(e) {
        console.log(e)
    }
}
