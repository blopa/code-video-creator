require('@babel/register');

const puppeteer = require('puppeteer');
// const prettier = require('prettier');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const {
    readFileSync,
    // writeFileSync,
    // mkdirSync,
    // rmdirSync,
} = require('fs');
const { generateHtml, getRandomBetween } = require('./utils');

const {
    ADD,
    WAIT,
    WIDTH,
    SCALE,
    HEIGHT,
    REMOVE,
    SELECT,
    SKIP_TO,
    MOVE_UP,
    REPLACE,
    MAX_LINES,
    MOVE_DOWN,
} = require('./constants');

const createVideo = async (htmls, lineDuration) => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [`--window-size=${WIDTH},${HEIGHT}`],
        defaultViewport: {
            width: WIDTH,
            height: HEIGHT,
        },
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
    await page.waitForTimeout(1000 * lineDuration);
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
};

const generateFiles = async (
    filePath, {
        smallTabs = false,
        typingSpeed = 1,
        lineDuration = 1,
        blinkTextBar = true,
    } = {}
) => {
    const sourceCode = readFileSync(filePath, { encoding: 'utf8' });

    // const data = readFileSync(filePath, { encoding: 'utf8' });
    // const code = prettier.format(data, { parser: "babel" });

    const lines = sourceCode.split('\n').map((codeLine) =>
        // replace all tabs by 4 whitespaces
        codeLine.replace(/\t/g, '    ')).map((codeLine) => {
        if (smallTabs) {
            return codeLine.replaceAll('    ', '  ');
        }

        return codeLine;
    });

    const scriptStart = '//#';
    let hasScript = false;
    let lineOffset = 0;
    if (
        lines[0].trimStart().startsWith(scriptStart)
        && lines[0].includes('has-script')
    ) {
        console.log('has script');
        // lines.splice(0, 1);
        hasScript = true;
        lineOffset += 1;
    }

    const codeLines = [];
    let lineCount = 0;
    let linesToSkip = 0;
    let extraWait = 0;
    const blinkDuration = 0.2;
    for (let i = 0; (i + lineOffset) < lines.length; i++) {
        let mainAction = ADD;
        let codeLine = lines[i + lineOffset];
        // console.log({lineCount, i, lineOffset, len: lines.length, codeLine});
        let lineNumber = lineCount;

        if (linesToSkip > 0) {
            codeLines.push({
                code: codeLine,
                line: lineNumber,
                action: ADD,
                duration: 0, // seconds
                skip: true,
            });
            linesToSkip -= 1;
            lineCount += 1;

            continue;
        }

        if (codeLine?.trim()?.length) {
            if (hasScript && codeLine.trimStart().startsWith(scriptStart)) {
                const [, command] = codeLine.split(scriptStart);
                const [
                    action,
                    line,
                    paste = 'false',
                    // lineQty = '1',
                ] = command.trim().split(',');
                const newAction = action.toUpperCase();

                if ([WAIT, REPLACE, SKIP_TO, MOVE_UP, MOVE_DOWN].includes(newAction)) {
                    mainAction = newAction;

                    if (mainAction === REPLACE) {
                        lineOffset += 1;
                        codeLine = lines[i + lineOffset];
                        lineNumber = Number.parseInt(line, 10) - lineOffset - 1;

                        if (paste === 'false') {
                            codeLines.push({
                                code: '|',
                                line: lineNumber,
                                action: SELECT,
                                duration: 2 * lineDuration, // seconds
                            });
                            codeLines.push({
                                code: ' ',
                                line: lineNumber,
                                action: SELECT,
                                duration: 0.5 * lineDuration, // seconds
                            });
                        } else {
                            codeLines.push({
                                code: '|',
                                line: lineNumber,
                                action: SELECT,
                                duration: lineDuration, // seconds
                            });

                            const codeToReplace = lines[lineNumber + lineOffset];
                            // console.log({codeToReplace});
                            const whiteSpacesCount = codeToReplace.length - codeToReplace.trimStart().length;
                            const accCodeLine = ''.padStart(whiteSpacesCount, ' ');
                            const trimmedCode = codeToReplace.trimStart();
                            const codeArr = [...trimmedCode];

                            [...codeArr].forEach(() => {
                                codeArr.pop();
                                codeLines.push({
                                    code: `${accCodeLine + codeArr.join('')}|`,
                                    line: lineNumber,
                                    action: REPLACE,
                                    duration: 0.06, // seconds
                                });
                            });

                            codeLines.push({
                                code: ' ',
                                line: lineNumber,
                                action: SELECT,
                                duration: 0.5 * lineDuration, // seconds
                            });

                            codeLines.push({
                                code: ' ',
                                line: lineNumber,
                                action: REPLACE,
                                duration: 0.5 * lineDuration, // seconds
                            });

                            codeLines.push({
                                code: codeLine,
                                line: lineNumber,
                                action: REPLACE,
                                duration: lineDuration, // seconds
                            });

                            continue;
                        }
                    } else if (mainAction === SKIP_TO) {
                        /*
                         * -2 because 1 to counter-down array starting with 0,
                         * and 1 to get the line before and show the chosen line animation
                         */
                        lineNumber = Number.parseInt(line, 10) - lineOffset - 2;
                    } else if (mainAction === MOVE_UP) {
                        lineCount -= Number.parseInt(line, 10);
                    } else if (mainAction === MOVE_DOWN) {
                        lineCount += Number.parseInt(line, 10);
                    } else if (mainAction === WAIT) {
                        extraWait = Number.parseInt(line, 10);
                        continue;
                    }
                }
            }

            const whiteSpacesCount = codeLine.length - codeLine.trimStart().length;
            let accCodeLine = ''.padStart(whiteSpacesCount, ' ');
            const trimmedCode = codeLine.trimStart();

            if (mainAction === SKIP_TO) {
                linesToSkip = lineNumber;
            } else if (![MOVE_DOWN, MOVE_UP].includes(mainAction)) {
                codeLines.push({
                    code: `${accCodeLine}|`,
                    line: lineNumber,
                    action: mainAction,
                    duration: 0.4 * lineDuration, // seconds
                });

                codeLines.push({
                    code: `${accCodeLine}|`,
                    line: lineNumber,
                    action: REPLACE,
                    duration: 0.2 * lineDuration, // seconds
                });

                [...trimmedCode].forEach((letter, idx) => {
                    accCodeLine += letter;
                    const ext = idx + 1 === trimmedCode.length ? '' : '|';

                    codeLines.push({
                        code: accCodeLine + ext,
                        line: lineNumber,
                        action: REPLACE,
                        duration: getRandomBetween(250, 100) / 1000 * typingSpeed, // seconds
                    });
                });

                if (extraWait) {
                    if (blinkTextBar) {
                        const blinkTimes = Math.ceil((extraWait / blinkDuration) / 2);
                        new Array(blinkTimes).fill(null).forEach(() => {
                            codeLines.push({
                                code: `${codeLine}|`,
                                line: lineNumber,
                                action: REPLACE,
                                duration: blinkDuration, // seconds
                            });

                            codeLines.push({
                                code: codeLine,
                                line: lineNumber,
                                action: REPLACE,
                                duration: blinkDuration, // seconds
                            });
                        });
                    } else {
                        codeLines.push({
                            code: codeLine,
                            line: lineNumber,
                            action: REPLACE,
                            duration: extraWait, // seconds
                        });
                    }

                    extraWait = 0;
                }

                if (blinkTextBar) {
                    codeLines.push({
                        code: `${codeLine}|`,
                        line: lineNumber,
                        action: REPLACE,
                        duration: blinkDuration, // seconds
                    });

                    codeLines.push({
                        code: codeLine,
                        line: lineNumber,
                        action: REPLACE,
                        duration: blinkDuration, // seconds
                    });
                }

                debugArr.push({mainAction, lineCount, codeLine});
                if (![WAIT, REPLACE].includes(mainAction)) {
                    lineCount += 1;
                }
            }
        } else {
            // line breaks here
            codeLines.push({
                code: `${codeLine}|`,
                line: lineNumber,
                action: ADD,
                duration: 0.2, // seconds
            });
            codeLines.push({
                code: codeLine,
                line: lineNumber,
                action: REPLACE,
                duration: 0.2, // seconds
            });

            if (extraWait) {
                if (blinkTextBar) {
                    const blinkTimes = Math.ceil((extraWait / blinkDuration) / 2);
                    new Array(blinkTimes).fill(null).forEach(() => {
                        codeLines.push({
                            code: `${codeLine}|`,
                            line: lineNumber,
                            action: REPLACE,
                            duration: blinkDuration, // seconds
                        });

                        codeLines.push({
                            code: codeLine,
                            line: lineNumber,
                            action: REPLACE,
                            duration: blinkDuration, // seconds
                        });
                    });
                } else {
                    codeLines.push({
                        code: codeLine,
                        line: lineNumber,
                        action: REPLACE,
                        duration: extraWait, // seconds
                    });
                }

                extraWait = 0;
            }

            if (blinkTextBar) {
                codeLines.push({
                    code: `${codeLine}|`,
                    line: lineNumber,
                    action: REPLACE,
                    duration: blinkDuration, // seconds
                });
                codeLines.push({
                    code: codeLine,
                    line: lineNumber,
                    action: REPLACE,
                    duration: blinkDuration, // seconds
                });
            }

            if (![WAIT, REPLACE].includes(mainAction)) {
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
    const language = (
        Object.entries(languages)
            .find(
                ([lang, extensions]) => extensions.includes(fileExtension)
            ) || ['javascript']
    )[0];

    console.log(`language is: ${language}`);

    const htmls = [];
    const codeToParse = [];
    const basePosY = 7;
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

    for (const codeObj of codeLines) {
        const {
            code,
            action,
            line,
            duration = 1,
            skip = false,
        } = codeObj;

         // console.log({codeObj, i})
         // console.log({ codeToParse, line });

        switch (action) {
            case ADD: {
                codeToParse.splice(line, 0, code);

                break;
            }

            case REMOVE: {
                codeToParse.splice(line, 1);

                break;
            }

            case REPLACE: {
                const lineCode = codeToParse[line];
                // if (!lineCode) console.log({ codeToParse, codeObj });
                const whiteSpacesCount = lineCode.length - lineCode.trimStart().length;
                const accCodeLine = ''.padStart(whiteSpacesCount, ' ');

                codeToParse.splice(line, 1, accCodeLine + code.trimStart());

                break;
            }

            case SELECT: {
                codeToParse.splice(line, 1, codeToParse[line] + code);

                break;
            }
        }

        if (skip) {
            continue;
        }

        console.log(`generating HTML for line ${line + 1}`);
        const html = generateHtml(
            codeToParse.filter((s) => s !== null).join('\n'),
            line,
            lines.length + scrollThreshold,
            language
        );

        // writeFileSync(`./html/index-${line}.html`, html);
        const diff = line - scrollThreshold;
        const posY = Math.max((basePosY + (16 * diff)) * SCALE, 0);

        htmls.push({
            duration,
            html,
            posY,
            line,
        });
    }

    console.log('creating video...');
    await createVideo(
        htmls,
        lineDuration
    );
};

module.exports = generateFiles;
