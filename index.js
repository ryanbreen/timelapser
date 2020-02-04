const { writeFileSync } = require('fs');
const { spawn } = require('child_process');

const uri = 'rtsp://192.168.1.130:7447/QUDbyFlP8TIZJgOE';

const grabFrame = async() => {
  const name = Date.now()
  this.child = spawn('ffmpeg', ['-rtsp_transport','tcp', '-i', 'rtsp://192.168.1.130:7447/QUDbyFlP8TIZJgOE',
    '-loglevel', 'quiet', '-r', '10', '-f', 'image2', `data/${name}.png`])
  for await (const data of this.child.stdout) {
  }
}

grabFrame()
setInterval(grabFrame, 10 * 1000);
