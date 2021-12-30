require('@babel/register');
const { generateHtml, sleep} = require('./utils');
const puppeteer = require('puppeteer');
// const prettier = require('prettier');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');


const { readFileSync, writeFileSync, mkdirSync, rmdirSync } = require('fs');

const { WIDTH, HEIGHT, MAX_LINES, SCALE, ADD, REMOVE, REPLACE} = require("./constants");

const createVideo = async (htmls) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [`--window-size=${WIDTH},${HEIGHT}`],
        defaultViewport: {
            width: WIDTH,
            height: HEIGHT,
        }
    });

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
    const recorder = new PuppeteerScreenRecorder(page, config);
    await recorder.start('./output.mp4');

    for (const {html, posY, duration} of htmls) {
        await page.setContent(html);
        await page.evaluate((scrollY) => {
            window.scrollBy(0, scrollY);
        }, posY);
        await sleep(duration * 1000);
    }

    await recorder.stop();
    await browser.close();
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
    const codeLines = lines.map((code, index) => {
        // TODO
        return {
            code,
            line: index,
            action: ADD,
            duration: 2, // seconds
        };
    });
    // codeLines.push({
    //     code: null,
    //     line: 5,
    //     action: ADD,
    // });
    // codeLines.push({
    //     code: '    console.log("Hello World");',
    //     line: 5,
    //     action: ADD,
    // });
    // codeLines.push({
    //     code: '    console.log("Hello World");',
    //     line: 4,
    //     action: REPLACE,
    // });

    // const html = generateHtml(code, lines.length, lines.length);
    // writeFileSync("./html/index.html", html);

    const images = [];
    const htmls = [];
    let index = 1;
    let codeToParse = [];
    let posX = 7;
    const scrollThreshold = (MAX_LINES / 2) + 1;
    for (const codeObj of codeLines) {
        const { code, action, line, duration = 1 } = codeObj;

        if (action === ADD) {
            codeToParse.splice(line, 0, code);
        } else if (action === REMOVE) {
            codeToParse.splice(line - 1, 1);
        } else if (action === REPLACE) {
            codeToParse.splice(line - 1, 1, code);
        }

        const html = generateHtml(
            codeToParse.filter((s) => s !== null).join('\n'),
            codeLines.length
        );

        // writeFileSync(`./html/index-${index}.html`, html);
        const diff = line - scrollThreshold;

        htmls.push({
            html,
            duration,
            posY: Math.max((posX + (16 * diff)) * SCALE, 0),
        });
        index += 1;
    }

    console.log('Creating video...')
    await createVideo(
        htmls
    );
}

const filePath = process.argv[2] || 'Test.jsx';
generateFiles(filePath);
