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
    LINE_DURATION,
} = require('./constants');

const getExtraWaitActionArray = (
    codeLine,
    lineNumber,
    extraWait,
    blinkTextBar,
    blinkDuration
) => {
    let codeLines = [];

    if (extraWait) {
        if (blinkTextBar) {
            codeLines = [
                ...codeLines,
                ...getBlinkingTextBarActionArray(
                    codeLine,
                    lineNumber,
                    extraWait,
                    blinkDuration
                ),
            ];
        } else {
            codeLines.push({
                code: codeLine,
                line: lineNumber,
                action: REPLACE,
                duration: extraWait, // seconds
            });
        }
    }

    return codeLines;
};

const getBlinkingTextBarActionArray = (
    codeLine,
    lineNumber,
    extraWait,
    blinkDuration
) => {
    const codeLines = [];

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

    return codeLines;
};

const getTypeInActionArray = (
    codeLine,
    lineNumber,
    typingSpeed,
    mainAction,
    lineSpeed
) => {
    let codeLines = [];

    const whiteSpacesCount = codeLine.length - codeLine.trimStart().length;
    let accCodeLine = ''.padStart(whiteSpacesCount, ' ');
    const trimmedCode = codeLine.trimStart();

    codeLines.push({
        code: `${accCodeLine}|`,
        line: lineNumber,
        action: mainAction,
        duration: 0.4 * lineSpeed, // seconds
    });

    codeLines.push({
        code: `${accCodeLine}`,
        line: lineNumber,
        action: REPLACE,
        duration: 0.2 * lineSpeed, // seconds
    });

    [...trimmedCode].forEach((letter, idx) => {
        accCodeLine += letter;
        const ext = idx + 1 === trimmedCode.length ? '' : '|';

        codeLines.push({
            code: accCodeLine + ext,
            line: lineNumber,
            action: REPLACE,
            duration: (getRandomBetween(300, 80) / 1000) * typingSpeed * lineSpeed, // seconds
        });
    });

    return codeLines;
};

const getTypeOutActionArray = (
    codeToReplace,
    lineNumber
) => {
    let codeLines = [];
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

    return codeLines;
}

const getReplaceActionArray = (
    codeLine,
    lineNumber,
    lineSpeed,
    paste,
    codeToReplace,
    typingSpeed,
    blinkDuration
) => {
    let codeLines = [];

    if (paste === 'false') {
        codeLines = [
            ...codeLines,
            ...getBlinkingTextBarActionArray(
                codeToReplace,
                lineNumber,
                lineSpeed / 2, // extraWait
                blinkDuration
            ),
            ...getBlinkingTextBarActionArray(
                '',
                lineNumber,
                lineSpeed / 2, // extraWait
                blinkDuration
            ),
            ...getTypeInActionArray(
                codeLine,
                lineNumber,
                typingSpeed,
                REPLACE,
                lineSpeed
            ),
        ];
    } else {
        codeLines = [
            ...codeLines,
            ...getBlinkingTextBarActionArray(
                codeToReplace,
                lineNumber,
                lineSpeed / 2, // extraWait
                blinkDuration
            ),
            ...getTypeOutActionArray(
                codeToReplace,
                lineNumber
            ),
            ...getBlinkingTextBarActionArray(
                '',
                lineNumber,
                lineSpeed / 2, // extraWait
                blinkDuration
            ),
            ...getBlinkingTextBarActionArray(
                codeLine,
                lineNumber,
                lineSpeed / 2, // extraWait
                blinkDuration
            ),
        ];
    }

    return codeLines;
}

const generateFiles = async (
    filePath, {
        smallTabs = false,
        typingSpeed = 1,
        lineSpeed = 1,
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

    let codeLines = [];
    let lineCount = 0;
    let linesToSkip = 0;
    let lineDurMplier = 1;
    let extraWait = 0;
    const blinkDuration = 0.2;
    const offsetMap = {};
    for (let i = 0; (i + lineOffset) < lines.length; i++) {
        offsetMap[i + lineOffset] = lineOffset;
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
                // has command
                const [, command] = codeLine.split(scriptStart);
                const [
                    action,
                    line,
                    paste = 'false',
                    // lineQty = '1',
                ] = command.trim().split(',');
                mainAction = action.toUpperCase();
                lineOffset += 1;
                i -= 1;

                switch (mainAction) {
                    case REPLACE: {
                        lineNumber = Number.parseInt(line, 10);
                        const codeToReplace = lines[lineNumber - 1];
                        lineNumber -= offsetMap[lineNumber] + 1;
                        codeLine = lines[i + lineOffset + 1];
                        lineOffset += 1;

                        codeLines = [
                            ...codeLines,
                            ...getReplaceActionArray(
                                codeLine,
                                lineNumber,
                                lineSpeed * lineDurMplier,
                                paste,
                                codeToReplace,
                                typingSpeed,
                                blinkDuration
                            ),
                        ];

                        break;
                    }

                    case MOVE_UP: {
                        lineCount -= Number.parseInt(line, 10);
                        continue;
                    }

                    case MOVE_DOWN: {
                        lineCount += Number.parseInt(line, 10);
                        continue;
                    }

                    case WAIT: {
                        extraWait = Number.parseInt(line, 10);
                        continue;
                    }

                    case SKIP_TO: {
                        linesToSkip = (Number.parseInt(line, 10) - lineOffset) - 1;
                        continue;
                    }

                    case LINE_DURATION: {
                        lineDurMplier = Number.parseFloat(line);
                        continue;
                    }
                }
            } else {
                // do not have command
                codeLines = [
                    ...codeLines,
                    ...getTypeInActionArray(
                        codeLine,
                        lineNumber,
                        typingSpeed,
                        ADD,
                        lineSpeed * lineDurMplier
                    ),
                    ...getExtraWaitActionArray(
                        codeLine,
                        lineNumber,
                        extraWait,
                        blinkTextBar,
                        blinkDuration
                    ),
                ];
            }
        } else {
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

            codeLines = [
                ...codeLines,
                ...getExtraWaitActionArray(
                    codeLine,
                    lineNumber,
                    extraWait,
                    blinkTextBar,
                    blinkDuration
                ),
            ];
        }

        extraWait = 0;
        lineDurMplier = 1;
        if (![REPLACE].includes(mainAction)) {
            lineCount += 1;
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

    console.log('creating video...');
    const browser = await puppeteer.launch({
        headless: true,
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
    await page.waitForTimeout(1000 * lineSpeed);
    console.log('start recording...');

    let prevPosY = null;
    let prevLine = null;
    const codeToParse = [];
    const basePosY = 7;
    const scrollThreshold = (MAX_LINES / 2) + 1;
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
                // if (!lineCode) console.log({ codeToParse, codeObj, lineCode });
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

        if (prevLine !== line) {
            prevLine = line;
            console.log(`rendering line ${line + 1}...`);
        }

        if (skip) {
            continue;
        }

        const html = generateHtml(
            codeToParse.filter((s) => s !== null).join('\n'),
            line,
            lines.length + scrollThreshold,
            language
        );

        // writeFileSync(`./html/index-${line}.html`, html);
        const diff = line - scrollThreshold;
        const posY = Math.max((basePosY + (16 * diff)) * SCALE, 0);

        if (prevPosY !== posY) {
            await page.waitForTimeout(0.25 * Math.abs(posY - prevPosY));
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

module.exports = generateFiles;
