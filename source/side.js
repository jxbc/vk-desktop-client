const {
    contextBridge,
    ipcRenderer
} = require("electron");
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const { Blob, Buffer } = require('buffer')
const os = require('os')
const crypto = require('crypto')

const ENC_KEY = "bf3c199c2470cb477d907b1e0917c17b";
const IV = "5183666c72eec9e4";
const APP_MODE = 'prod' //режим разработчика или продакшн

let dirr = "C:/"
let dir_save = nextPatch('temp/')

function nextPatch(name) { //ЗАВИСИТ ОТ APP MODE
    let path = __dirname;
    let binaryPath = __dirname + `\\binary\\`
    let newPath = path.replace('app.asar', name)

    if(APP_MODE == 'dev') return binaryPath;

    return newPath
}

function getFFPath() {
    let platform = os.platform()
    let patch = nextPatch('binary')
    if(platform == 'win32') { 
        return patch + `\\win\\ffmpeg.exe`
    }
    if(platform == 'darwin')  {
        return patch + "/mac/ffmpeg"
    }
}

console.log(getFFPath())

ffmpeg.setFfmpegPath(getFFPath())

contextBridge.exposeInMainWorld(
    "vkc", {
        rpc: (channel, data) => {
            let validChannels = ["action", "render"];
            if(validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        encrypt: (value) => {
            let cipher = crypto.createCipheriv('aes-256-cbc', ENC_KEY, IV);
            let encrypted = cipher.update(value, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return 'vkdc::' + encrypted;
        },
        decrypt: (value) => {
            try {
                value = value.replace('vkdc::', '')
                let decipher = crypto.createDecipheriv('aes-256-cbc', ENC_KEY, IV);
                let decrypted = decipher.update(value, 'hex', 'utf8');
                return (decrypted + decipher.final('utf8'));
            } catch(err) {
                return {error: 'cipher'}
            }
        },
        createTempDir: () => {
            fs.mkdirSync(dirr + 'VKClientTemp');
        },
        oggToBlob: () => {
            let buff = fs.readFileSync(dir_save + 'temp.ogg');
            fs.rmSync(dir_save + 'temp.ogg');
            return buff;
        },
        videoToVoice: (path, resolve) => {
            console.log('started ' + path)
            ffmpeg(path)
            .audioBitrate('64k')
            .audioChannels(1)
            .audioCodec('libopus')
            .save(dir_save + 'temp.ogg')
            .on('progress', (p) => {
            })
            .on('error', (err, stdout, stderr) => {
                console.log(err)
                console.log(stdout)
            })
            .on('end', () => {
                resolve('ok')
            })
        },
        on: (channel, func) => {
            let validChannels = ["byRpc"];
            if(validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
);