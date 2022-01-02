require('@babel/register');
const { generateHtml, getRandomBetween } = require('./utils');
const puppeteer = require('puppeteer');
// const prettier = require('prettier');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

const { readFileSync, writeFileSync, mkdirSync, rmdirSync } = require('fs');

const { WIDTH, HEIGHT, MAX_LINES, SCALE, ADD, REMOVE, REPLACE, SELECT, SKIP_TO } = require("./constants");

const createVideo = async (htmls) => {
    const browser = await puppeteer.launch({
        headless: false,
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
    let lineCount = 0;
    let linesToSkip = 0;
    for (let i = 0; (i + lineOffset) < lines.length; i++) {
        let mainAction = ADD;
        let codeLine = lines[i + lineOffset];
        // console.log({lineCount, i, lineOffset, len: lines.length, codeLine});
        let cleanCode = codeLine.replace(/\t/g, '    ');
        let lineNumber = lineCount;

        if (linesToSkip > 0) {
            console.log('to aqui!!!', {linesToSkip});
            codeLines.push({
                code: cleanCode,
                line: lineNumber,
                action: ADD,
                duration: 0, // seconds
                skip: true,
            });
            linesToSkip -= 1;
            lineCount += 1;

            continue;
        }

        if (cleanCode?.trim()?.length) {
            if (hasScript && codeLine.trimLeft().startsWith(scriptStart)) {
                const [, command] = codeLine.split(scriptStart);
                const [
                    action,
                    line,
                    // lineQty = '1',
                    paste = 'false',
                ] = command.trim().split(',');
                const newAction = action.toUpperCase();

                if ([REPLACE, SKIP_TO].includes(newAction)) {
                    mainAction = newAction;

                    if (mainAction === REPLACE) {
                        lineOffset += 1;
                        codeLine = lines[i + lineOffset];
                        cleanCode = codeLine.replace(/\t/g, '    ');
                        lineNumber = parseInt(line) - lineOffset - 1;

                        if (paste === 'false') {
                            codeLines.push({
                                code: '|',
                                line: lineNumber,
                                action: SELECT,
                                duration: 2, // seconds
                            });
                            codeLines.push({
                                code: ' ',
                                line: lineNumber,
                                action: SELECT,
                                duration: 0.5, // seconds
                            });
                        } else {
                            codeLines.push({
                                code: '|',
                                line: lineNumber,
                                action: SELECT,
                                duration: 1, // seconds
                            });

                            const codeToReplace = lines[lineNumber + lineOffset];
                            // console.log({codeToReplace});
                            const cleanCodeToReplace = codeToReplace.replace(/\t/g, '    ');
                            const whiteSpacesCount = cleanCodeToReplace.length - cleanCodeToReplace.trimLeft().length;
                            let accCodeLine = ''.padStart(whiteSpacesCount, ' ');
                            const trimmedCode = cleanCodeToReplace.trimLeft();
                            const codeArr = trimmedCode.split('');

                            [...codeArr].forEach(() => {
                                codeArr.pop();
                                codeLines.push({
                                    code: accCodeLine + codeArr.join('') + '|',
                                    line: lineNumber,
                                    action: REPLACE,
                                    duration:  0.01, // seconds
                                });
                            });

                            codeLines.push({
                                code: ' ',
                                line: lineNumber,
                                action: SELECT,
                                duration: 1, // seconds
                            });

                            codeLines.push({
                                code: cleanCode,
                                line: lineNumber,
                                action: REPLACE,
                                duration: 1, // seconds
                            });

                            continue;
                        }
                    } else if (mainAction === SKIP_TO) {
                        // -2 because 1 to counter-down array starting with 0,
                        // and 1 to get the line before and show the chosen line animation
                        lineNumber = parseInt(line) - lineOffset - 2;
                    }
                }
            }

            const whiteSpacesCount = cleanCode.length - cleanCode.trimLeft().length;
            let accCodeLine = ''.padStart(whiteSpacesCount, ' ');
            const trimmedCode = cleanCode.trimLeft();

            if (mainAction === SKIP_TO) {
                linesToSkip = lineNumber;
            } else {
                codeLines.push({
                    code: accCodeLine + '|',
                    line: lineNumber,
                    action: mainAction,
                    duration: 0.9, // seconds
                });

                codeLines.push({
                    code: accCodeLine + '|',
                    line: lineNumber,
                    action: REPLACE,
                    duration: 0.1, // seconds
                });

                trimmedCode.split('')
                    .forEach((letter, idx) => {
                        accCodeLine += letter;
                        const ext = idx + 1 === trimmedCode.length ? '' : '|';

                        codeLines.push({
                            code: accCodeLine + ext,
                            line: lineNumber,
                            action: REPLACE,
                            duration:  getRandomBetween(250, 100) / 1000, // seconds
                        });
                    });

                if (![REPLACE].includes(mainAction)) {
                    lineCount += 1;
                }
            }
        } else {
            // line breaks here
            codeLines.push({
                code: codeLine + '|',
                line: lineNumber,
                action: ADD,
                duration: 0.5, // seconds
            });
            codeLines.push({
                code: codeLine,
                line: lineNumber,
                action: REPLACE,
                duration: 0.1, // seconds
            });

            if (![REPLACE].includes(mainAction)) {
                lineCount += 1;
            }
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
    // const map = {};
    // console.log(codeLines.filter((obj) => {
    //     if (map[obj.line] === undefined) {
    //         map[obj.line] = true;
    //         return true;
    //     }
    //
    //     return false;
    // }));

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
            const lineCode = codeToParse[line];
            // if (!lineCode) console.log({ codeToParse, codeObj });
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
