const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname, 'models');

if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const models = [
    {
        name: 'w600k_r50.onnx',
        url: 'https://huggingface.co/maze/faceX/resolve/main/w600k_r50.onnx'
    },
    {
        name: 'blaze_face_short_range.tflite',
        url: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'
    }
];

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    console.log(`Downloaded ${path.basename(dest)}`);
                    resolve();
                });
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
};

async function main() {
    console.log('Downloading models...');
    for (const model of models) {
        const dest = path.join(modelsDir, model.name);
        if (fs.existsSync(dest)) {
            console.log(`${model.name} already exists. Skipping.`);
            continue;
        }
        try {
            await downloadFile(model.url, dest);
        } catch (err) {
            console.error(`Failed to download ${model.name}:`, err);
        }
    }
    console.log('Done.');
}

main();
