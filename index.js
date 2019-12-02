const { writeFileSync } = require('fs');
const { spawn } = require('child_process');

const uri = 'rtsp://192.168.1.130:7447/QUDbyFlP8TIZJgOE';

const grabFrame = async () => {
  let buff = Buffer.from('');

  this.child = spawn('ffmpeg', ['-rtsp_transport','tcp', '-i', 'rtsp://192.168.1.130:7447/QUDbyFlP8TIZJgOE',
    '-vframes', '1', '-loglevel', 'quiet', '-f', 'image2', '-vf', 'fps=fps=24', '-q:v', '2', '-'])
  this.child.stdout.on('data', (data) => {
    console.log(data)
    buff = Buffer.concat([buff, data]);
    if (data.length > 1) {
      offset      = data[data.length-2].toString(16);
      offset2     = data[data.length-1].toString(16);

      if(offset == "ff" && offset2 == "d9") {
        writeFileSync('test.png', buff)
        buff = Buffer.from('');
      }
    }
  });

}

grabFrame();