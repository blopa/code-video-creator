require('@babel/register');
const { generateHtml } = require('./utils');
const nodeHtmlToImage = require('node-html-to-image');
const prettier = require('prettier');
const videoshow = require('videoshow');
const { readFileSync, writeFileSync, mkdirSync } = require('fs');
const { WIDTH, HEIGHT } = require("./sizes");

const createScreenshot = async (html, filePath) => {
    await nodeHtmlToImage({
        output: filePath,
        html,
        type: 'png',
        quality: 100,
        puppeteerArgs: {
            defaultViewport: {
                width: WIDTH,
                height: HEIGHT,
            }
        },
    });
}

const createVideo = (images) => {
    const videoOptions = {
        fps: 25,
        loop: 2,
        transition: false,
        videoBitrate: 1024,
        videoCodec: 'libx264',
        size: '1920x?',
        audioBitrate: '128k',
        audioChannels: 2,
        format: 'mp4',
        pixelFormat: 'yuv420p'
    }

    return videoshow(images, videoOptions)
        .save('./video.mp4')
        .on('start', function (command) {
            console.log('ffmpeg process started:', command)
        })
        .on('error', function (err, stdout, stderr) {
            console.error('Error:', err)
            console.error('ffmpeg stderr:', stderr)
        })
        .on('end', function (output) {
            console.error('Video created in:', output)
        })
}

const generateFiles = async (filePath) => {
    const data = readFileSync(filePath, { encoding: 'utf8' });
    const code = prettier.format(data, { parser: "babel" });
    const lines = code.split('\n');
    mkdirSync(`./frames/`, { recursive: true });

    const html = generateHtml(code, 10);
    writeFileSync("index.html", html);

    const images = [];
    let index = 0;
    for (const line of lines) {
        const filePath = `./frames/${index}.png`;

        const html = generateHtml(code, index);
        console.log(`Creating image: ${filePath}`);
        await createScreenshot(html, filePath);
        console.log('Done!');
        images.push(filePath);
        index += 1;
    }

    console.log('Creating video...')
    await createVideo(images);
    console.log('Done!');
}

const file = process.argv[2] || './Test.jsx';
generateFiles(file);
