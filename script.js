require('@babel/register');
const { generateHtml, getRandomBetween } = require('./utils');
const puppeteer = require('puppeteer');
// const prettier = require('prettier');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

const { readFileSync, writeFileSync, mkdirSync, rmdirSync } = require('fs');

const { WIDTH, HEIGHT, MAX_LINES, SCALE, ADD, REMOVE, REPLACE, SELECT, SKIP_TO } = require("./constants");

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
    console.log('start recording...');

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

    console.log('stop recording');
    await recorder.stop();
    console.log('close browser');
    await browser.close();
}

const generateFiles = async (filePath) => {
    const code = readFileSync(filePath, { encoding: 'utf8' });
    // const data = readFileSync(filePath, { encoding: 'utf8' });
    // const code = prettier.format(data, { parser: "babel" });
    const lines = code.split('\n');
    const scriptStart = '//#';
    let hasScript = false;
    let lineOffset = 0;
    if (lines[0].trimLeft().startsWith(scriptStart) && lines[0].includes('has-script')) {
        console.log('has script');
        // lines.splice(0, 1);
        hasScript = true;
        lineOffset += 1;
    }

    const codeLines = [];
    let linesToSkip = 0;
    for (let i = lineOffset; i < lines.length; i++) {
        let mainLine = i - lineOffset;
        let codeLine = lines[mainLine + lineOffset];
        let cleanCode = codeLine.replace(/\t/g, '    ');
        // console.log({ mainLine, codeLine, i, lineOffset });

        if (linesToSkip > 0) {
            codeLines.push({
                code: cleanCode,
                line: mainLine,
                action: ADD,
                duration: 0, // seconds
                skip: true,
            });
            linesToSkip -= 1;
            continue;
        }

        if (codeLine?.length) {
            let mainAction = ADD;

            if (hasScript && codeLine.trimLeft().startsWith(scriptStart)) {
                const [, command] = codeLine.split(scriptStart);
                const [
                    action,
                    line,
                    // lineQty = '1',
                    paste = 'false',
                ] = command.trim().split(',');

                lineOffset += 1;
                codeLine = lines[mainLine + lineOffset];
                cleanCode = codeLine.replace(/\t/g, '    ');
                // console.log({codeLine, lineOffset});
                mainLine = parseInt(line) - lineOffset;
                const newAction = action.toUpperCase();
                // console.log({newAction});

                if ([REPLACE, SKIP_TO].includes(newAction)) {
                    mainAction = newAction;

                    // TODO replace only works if is the last line
                    if (mainAction === REPLACE) {
                        // lineOffset += 1;
                        // i += 1;

                        if (paste === 'false') {
                            codeLines.push({
                                code: '|',
                                line: mainLine,
                                action: SELECT,
                                duration: 2, // seconds
                            });
                            codeLines.push({
                                code: ' ',
                                line: mainLine,
                                action: SELECT,
                                duration: 0.5, // seconds
                            });
                        } else {
                            codeLines.push({
                                code: '|',
                                line: mainLine,
                                action: SELECT,
                                duration: 2, // seconds
                            });
                            codeLines.push({
                                code: ' ',
                                line: mainLine,
                                action: SELECT,
                                duration: 0.5, // seconds
                            });
                            codeLines.push({
                                code: cleanCode,
                                line: mainLine,
                                action: REPLACE,
                                duration: 1, // seconds
                            });

                            continue;
                        }
                    }
                }
            }

            cleanCode = codeLine.replace(/\t/g, '    ');
            const whiteSpacesCount = cleanCode.length - cleanCode.trimLeft().length;
            let accCodeLine = ''.padStart(whiteSpacesCount, ' ');
            const trimmedCode = cleanCode.trimLeft();

            // console.log({mainAction, mainLine, linesToSkip});
            if (mainAction === SKIP_TO) {
                linesToSkip = mainLine - 1;
            } else {
                codeLines.push({
                    code: accCodeLine + '|',
                    line: mainLine,
                    action: mainAction,
                    duration: 0.9, // seconds
                });

                codeLines.push({
                    code: accCodeLine + '|',
                    line: mainLine,
                    action: REPLACE,
                    duration: 0.1, // seconds
                });

                trimmedCode.split('')
                    .forEach((letter, idx) => {
                        accCodeLine += letter;
                        const ext = idx + 1 === trimmedCode.length ? '' : '|';

                        codeLines.push({
                            code: accCodeLine + ext,
                            line: mainLine,
                            action: REPLACE,
                            duration:  getRandomBetween(250, 100) / 1000, // seconds
                        });
                    });
            }
        } else {
            codeLines.push({
                code: codeLine,
                line: mainLine,
                action: ADD,
                duration: 0.5, // seconds
            });
        }
    }

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
    for (let i = 0; i < codeLines.length; i++) {
        const codeObj = codeLines[i];
        const {
            code,
            action,
            line,
            duration = 1,
            skip = false,
        } = codeObj;

        // console.log({codeObj, i})
        // console.log({ codeToParse, line });

        if (action === ADD) {
            codeToParse.splice(line, 0, code);
        } else if (action === REMOVE) {
            codeToParse.splice(line, 1);
        } else if (action === REPLACE) {
            // console.log({ codeToParse, line });
            const lineCode = codeToParse[line];
            const whiteSpacesCount = lineCode.length - lineCode.trimLeft().length;
            let accCodeLine = ''.padStart(whiteSpacesCount, ' ');

            codeToParse.splice(line, 1, accCodeLine + code.trimLeft());
        } else if (action === SELECT) {
            codeToParse.splice(line, 1, codeToParse[line] + code);
        }

        if (skip) {
            continue;
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
