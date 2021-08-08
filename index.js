import spawn from 'await-spawn'

const uri = 'rtsp://10.0.2.5:7447/4zlmq5j4Zz4PE4Hz'

const run = async () => {
  try {
    await spawn('ffmpeg', ['-rtsp_transport','tcp', '-i', uri,
      '-loglevel', 'quiet',  '-f', 'image2', '-pix_fmt', 'yuva444p16le', '-vf', 'fps=1/5', '-strftime', '1', `data/%s%03d.png`])
  } catch(e) {
    console.log(e.stderr.toString())
  }
}

run();
//setInterval(grabFrame, 10 * 1000);
