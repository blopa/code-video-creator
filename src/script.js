require('@babel/register');

const { readFileSync } = require('fs');

// Puppeteer
const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

// Utils
const { generateHtml } = require('./utils');

// Constants
const {
    WIDTH,
    SCALE,
    HEIGHT,
    ENCODING,
    MAX_LINES,
    LINE_HEIGHT,
} = require('./constants');

const generateVideo = async (filePath) => {
    const code = readFileSync(filePath, {
        encoding: ENCODING,
    });
    const lines = code.split('\n');

    // detect file language
    const fileExtension = filePath.split('.').pop();
    const languages = JSON.parse(
        readFileSync('./languages.json', {
            encoding: ENCODING,
        })
    );
    const locatedLang = Object.entries(languages).find(
        ([lang, ext]) => ext.includes(fileExtension)
    );
    const language = locatedLang[0] || 'javascript';
    console.log(`language is: ${language}`);

    // Puppeteer config
    const browser = await puppeteer.launch({
        headless: true,
        args: [`--window-size=${WIDTH},${HEIGHT}`],
        defaultViewport: {
            width: WIDTH,
            height: HEIGHT,
        },
    });

    // open a new empty page
    const page = await browser.newPage();
    const config = {
        followNewTab: false,
        fps: 25,
        ffmpeg_Path: null,
        videoFrame: {
            width: WIDTH,
            height: HEIGHT,
        },
        aspectRatio: '16:9',
    };

    const recorder = new PuppeteerScreenRecorder(
        page,
        config
    );

    // start recording
    await recorder.start('./output.mp4');
    await page.waitForTimeout(500);

    let index = 0;
    let prevPosY = 0;
    const basePosY = 7;
    let codeToParse = [];
    const scrollThreshold = (MAX_LINES / 2) + 1;

    for (const line of lines) {
        index += 1;
        console.log(`rendering line ${index}`);

        codeToParse.push(line);

        // get full page HTML
        const html = generateHtml(
            codeToParse.join('\n'),
            index - 1,
            lines.length + scrollThreshold,
            language
        );

        // set page HTML
        await page.setContent(html);

        const diff = index - scrollThreshold;
        const posY = Math.max(
            (basePosY + (LINE_HEIGHT * diff)) * SCALE,
            0
        );

        // scroll down or up if needed
        if (prevPosY !== posY) {
            await page.evaluate((posY) => {
                window.scrollTo({
                    top: posY,
                    behavior: 'smooth',
                });
            }, posY);
        }

        await page.waitForTimeout(1000);
        prevPosY = posY;
    }

    await recorder.stop();
    await browser.close();
    console.log('Done!');
}

const filePath =
    process.argv[2] || './examples/Test.jsx';

generateVideo(filePath);
