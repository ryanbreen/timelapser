const { writeFileSync } = require('fs');
const { spawn } = require('child_process');

const uri = 'rtsp://10.0.2.5:7447/4zlmq5j4Zz4PE4Hz'

const grabFrame = async() => {
  const name = Date.now()
  this.child = spawn('ffmpeg', ['-rtsp_transport','tcp', '-i', uri,
    '-loglevel', 'quiet', '-r', '10', '-f', 'image2', `data/${name}.png`])
  for await (const data of this.child.stdout) {
  }
}

grabFrame()
setInterval(grabFrame, 10 * 1000);
