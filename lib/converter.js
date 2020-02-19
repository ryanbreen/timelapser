
import { spawn } from 'child_process'
import progress from 'progress'

import { readdir, rmdir, mkdir, symlink } from 'fs'
import util from 'util'

import _ from 'lodash'

const ln_s = util.promisify(symlink)
const mkdirf = util.promisify(mkdir)
const readdirf = util.promisify(readdir)
const rmdirf = util.promisify(rmdir)

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

    console.log("Found %s files between %s and %s for %s", files.length, new Date(record.start), new Date(record.end), record.name)

    for await(const file of files) {
        try {
            await ln_s(`/pool/view_data/${file}`, `/pool/view_data/temp/${file}`)
        } catch(e) {
        }
    }

    return files.length
}

const callFFMPEG = async (frames, name) => {
        
    const produce = spawn('ffmpeg', ['-r','60','-pattern_type','glob','-i','*.png', '-c:v', 'libx265', `../processed/${name}.mp4`], { cwd: '/pool/view_data/temp/' })

    let frameCounter = 0

    const bar = new progress('  Converting [:bar] :percent :etas', { total: frames });

    produce.stderr.on('data', data => {
        const datar = data.toString()
        //console.log(datar)
        
        const match = datar.match(/frame=\s*([\d]*)\s*fps/)
        if (match && match.length > 0) {
            const frame = parseInt(match[1])
            bar.update(frame / frames)
        }
    });

    const exitCode = await new Promise( (resolve, reject) => {
        produce.on('close', resolve);
    });
}

export const produceVideo = async (record) => {
    try {
        const frames = await collectAllFiles(record)
        await callFFMPEG(frames, record.name)
    } catch(e) {
        console.log(e)
    }
}
