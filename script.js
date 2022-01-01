require('@babel/register');
const { generateHtml, getRandomBetween } = require('./utils');
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
    await page.waitForTimeout(1000);
    console.log('start recodring...');

    let prevPosY = null;
    for (const { html, posY, duration, line } of htmls) {
        console.log(`rendering line ${line}`);
        if (prevPosY !== posY) {
            await page.waitForTimeout(0.18 * Math.abs(posY - prevPosY));
        }

        await page.setContent(html);

        if (prevPosY !== posY) {
            await page.evaluate((posY) => {
                // 180ms per 1000px
                window.scrollTo({
                    top: posY,
                    behavior: 'smooth',
                });

                // document.getElementsByTagName('html')[0].innerHTML = html;
            }, posY);
        }

        await page.waitForTimeout(duration * 1000);
        prevPosY = posY;
    }

    console.log('stop recodring');
    await recorder.stop();
    console.log('close browser');
    await browser.close();
}

const generateFiles = async (filePath) => {
    const code = readFileSync(filePath, { encoding: 'utf8' });
    // const data = readFileSync(filePath, { encoding: 'utf8' });
    // const code = prettier.format(data, { parser: "babel" });
    const lines = code.split('\n');
    const codeLines = [];
    lines.forEach((code, index) => {
        if (code?.length) {
            const cleanCode = code.replace(/\t/g, '    ');
            const whiteSpacesCount = cleanCode.length - cleanCode.trimLeft().length;
            let accCodeLine = ''.padStart(whiteSpacesCount, ' ');
            const trimmedCode = cleanCode.trimLeft();

            codeLines.push({
                code: accCodeLine + '|',
                line: index,
                action: ADD,
                duration: 0.9, // seconds
            });

            codeLines.push({
                code: accCodeLine + '|',
                line: index,
                action: REPLACE,
                duration: 0.1, // seconds
            });

            trimmedCode.split('')
                .forEach((letter, idx) => {
                    accCodeLine += letter;
                    const ext = idx + 1 === trimmedCode.length ? '' : '|';

                    codeLines.push({
                        code: accCodeLine + ext,
                        line: index,
                        action: REPLACE,
                        duration:  getRandomBetween(250, 100) / 1000, // seconds
                    });
                });
        } else {
            codeLines.push({
                code,
                line: index,
                action: ADD,
                duration: 0.5, // seconds
            });
        }
    });
    // codeLines.push({
    //     code: null,
    //     line: 5,
    //     action: ADD,
    // });
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

    const languages = JSON.parse(
        readFileSync('./languages.json', { encoding: 'utf8' })
    );
    const fileExtension = filePath.split('.').pop();
    const language = (Object.entries(languages).find(([lang, extensions]) => {
        return extensions.includes(fileExtension);
    }) || ['javascript'])[0];

    console.log(`language is: ${language}`);

    const htmls = [];
    let codeToParse = [];
    let basePosY = 7;
    const scrollThreshold = (MAX_LINES / 2) + 1;
    // console.log(codeLines);
    for (const codeObj of codeLines) {
        const { code, action, line, duration = 1 } = codeObj;

        if (action === ADD) {
            codeToParse.splice(line, 0, code);
        } else if (action === REMOVE) {
            codeToParse.splice(line, 1);
        } else if (action === REPLACE) {
            codeToParse.splice(line, 1, code);
        }

        console.log(`generating HTML for line ${line}`);
        const html = generateHtml(
            codeToParse.filter((s) => s !== null).join('\n'),
            line,
            codeLines.length,
            language
        );

        writeFileSync(`./html/index-${line}.html`, html);
        const diff = line - scrollThreshold;
        const posY = Math.max((basePosY + (16 * diff)) * SCALE, 0);

        htmls.push({
            duration,
            html,
            posY,
            line,
        });
    }

    console.log('creating video...')
    await createVideo(
        htmls
    );
}

const filePath = process.argv[2] || './examples/Test.jsx';
generateFiles(filePath);
