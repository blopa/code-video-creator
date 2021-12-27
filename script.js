require('@babel/register');
const { generateHtml } = require('./utils');
const puppeteer = require('puppeteer');
const prettier = require('prettier');
const videoshow = require('videoshow');

const { readFileSync, writeFileSync, mkdirSync, rmdirSync } = require('fs');

const { WIDTH, HEIGHT } = require("./sizes");

const createScreenshot = async (html, filePath) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [`--window-size=${WIDTH},${HEIGHT}`],
        defaultViewport: {
            width: WIDTH,
            height: HEIGHT,
        }
    });

    const page = await browser.newPage();
    page.setContent(html);

    await page.screenshot({
        path: filePath,
        // omitBackground: true,
        // clip: {
        //     x: rect.left - padding,
        //     y: rect.top - padding,
        //     width: rect.width + padding * 2,
        //     height: rect.height + padding * 2
        // }
    });

    await browser.close();
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
    const fileOutput = `./frames/`;
    mkdirSync(fileOutput, { recursive: true });
    rmdirSync(fileOutput, { recursive: true });
    mkdirSync(fileOutput, { recursive: true });

    const code = readFileSync(filePath, { encoding: 'utf8' });
    // const data = readFileSync(filePath, { encoding: 'utf8' });
    // const code = prettier.format(data, { parser: "babel" });
    const lines = code.split('\n');

    const html = generateHtml(code, lines.length, lines.length);
    // writeFileSync("./html/index.html", html);

    const images = [];
    let index = 0;
    for (const line of lines) {
        const filePath = `${fileOutput}${index}.png`;

        const html = generateHtml(code, index + 1, lines.length);
        writeFileSync(`./html/index-${index}.html`, html);
        console.log(`Creating image: ${filePath}`);
        await createScreenshot(html, filePath);
        console.log('Done!');
        images.push(filePath);
        index += 1;
    }

    console.log('Creating video...')
    await createVideo(images);
}

const file = process.argv[2] || './Test.jsx';
generateFiles(file);
