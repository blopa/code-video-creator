require('@babel/register');
const { generateHtml } = require('./utils');
const puppeteer = require('puppeteer');
// const prettier = require('prettier');
const videoshow = require('videoshow');

const { readFileSync, writeFileSync, mkdirSync, rmdirSync } = require('fs');

const { WIDTH, HEIGHT, MAX_LINES, SCALE } = require("./constants");

const createScreenshot = async (html, filePath, posY) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [`--window-size=${WIDTH},${HEIGHT}`],
        defaultViewport: {
            width: WIDTH,
            height: HEIGHT,
        }
    });

    const page = await browser.newPage();
    await page.setContent(html);
    await page.evaluate((scrollY) => {
        window.scrollBy(0, scrollY);
    }, posY);

    await page.screenshot({
        path: filePath,
        // omitBackground: true,
        // clip: {
        //     y: posY,
        //     x: 0,
        //     width: WIDTH,
        //     height: HEIGHT
        // }
    });

    await browser.close();
}

const createVideo = (images) => {
    const videoOptions = {
        fps: 25,
        loop: 2, // seconds
        transition: false,
        videoBitrate: 1024,
        videoCodec: 'libx264',
        size: '1920x?',
        audioBitrate: '128k',
        audioChannels: 2,
        format: 'mp4',
        pixelFormat: 'yuv420p'
    };

    return videoshow(images, videoOptions)
        .save('./output.mp4')
        .on('start', function (command) {
            console.log('ffmpeg process started:', command);
        })
        .on('error', function (err, stdout, stderr) {
            console.error('Error:', err);
            console.error('ffmpeg stdout:', stdout);
            console.error('ffmpeg stderr:', stderr);
        })
        .on('end', function (output) {
            console.error('Video created in:', output);
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

    // const html = generateHtml(code, lines.length, lines.length);
    // writeFileSync("./html/index.html", html);

    const images = [];
    let index = 0;
    let codeToParse = '';
    let posX = 21;
    const lineToStartScrolling = (MAX_LINES / 2) + 1;
    for (const line of lines) {
        index += 1;
        const filePath = `${fileOutput}${index}.png`;

        codeToParse = `${codeToParse}${line}\n`;
        const html = generateHtml(codeToParse, index - 1, lines.length);
        // writeFileSync(`./html/index-${index}.html`, html);
        console.log(`Creating image: ${filePath}`);
        await createScreenshot(
            html,
            filePath,
            index > lineToStartScrolling ? (posX * SCALE) : 0
        );

        if (index > lineToStartScrolling) {
            posX += 16;
        }

        console.log('Done!');
        images.push(filePath);
    }

    console.log('Creating video...')
    await createVideo(images);
}

const filePath = process.argv[2] || 'Test.jsx';
generateFiles(filePath);
