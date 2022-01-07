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

const getTypeInActionArray = (
    codeLine,
    lineNumber,
    typingSpeed,
    mainAction,
    lineDuration
) => {
    let codeLines = [];

    const whiteSpacesCount = codeLine.length - codeLine.trimStart().length;
    let accCodeLine = ''.padStart(whiteSpacesCount, ' ');
    const trimmedCode = codeLine.trimStart();

    codeLines.push({
        code: `${accCodeLine}|`,
        line: lineNumber,
        action: mainAction,
        duration: 0.4 * lineDuration, // seconds
    });

    codeLines.push({
        code: `${accCodeLine}`,
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
            duration: (getRandomBetween(300, 80) / 1000) * typingSpeed, // seconds
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
    lineDuration,
    paste,
    codeToReplace,
    typingSpeed
) => {
    let codeLines = [];

    if (paste === 'false') {
        const newCodeLines = getTypeInActionArray(
            codeLine,
            lineNumber,
            typingSpeed,
            REPLACE,
            lineDuration
        );

        codeLines = [...codeLines, ...newCodeLines];
    } else {
        const newCodeLines = getTypeOutActionArray(
            codeToReplace,
            lineNumber
        );

        newCodeLines.push({
            code: ' ',
            line: lineNumber,
            action: REPLACE,
            duration: 0.5 * lineDuration, // seconds
        });

        newCodeLines.push({
            code: codeLine,
            line: lineNumber,
            action: REPLACE,
            duration: lineDuration, // seconds
        });

        codeLines = [...codeLines, ...newCodeLines];
    }

    return codeLines;
}

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

    let codeLines = [];
    let lineCount = 0;
    let linesToSkip = 0;
    let extraWait = 0;
    const blinkDuration = 0.2;
    const offsetMap = {};
    for (let i = 0; (i + lineOffset) < lines.length; i++) {
        offsetMap[i + lineOffset] = lineOffset;
        let newCodeLines = [];
        let mainAction = ADD;
        let codeLine = lines[i + lineOffset];
        // console.log({lineCount, i, lineOffset, len: lines.length, codeLine});
        let lineNumber = lineCount;

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

                switch (mainAction) {
                    case REPLACE: {
                        lineNumber = Number.parseInt(line, 10);
                        const codeToReplace = lines[lineNumber - 1];
                        lineNumber -= offsetMap[lineNumber] + 1;
                        codeLine = lines[i + lineOffset];
                        i -= 1;
                        lineOffset += 1;

                        newCodeLines = getReplaceActionArray(
                            codeLine,
                            lineNumber,
                            lineDuration,
                            paste,
                            codeToReplace,
                            typingSpeed
                        );

                        break;
                    }

                    case MOVE_UP: {
                        // lineCount -= Number.parseInt(line, 10);
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
                        lineNumber = Number.parseInt(line, 10) - lineOffset;
                        break;
                    }
                }
            } else {
                // do not have command
                console.log({ codeLine, lineNumber });
                newCodeLines = getTypeInActionArray(
                    codeLine,
                    lineNumber,
                    typingSpeed,
                    ADD,
                    lineDuration
                );
            }
        } else {
            codeLines.push({
                code: codeLine,
                line: lineNumber,
                action: ADD,
                duration: 1, // seconds
            });
        }

        if (![REPLACE].includes(mainAction)) {
            lineCount += 1;
        }

        codeLines = [
            ...codeLines,
            ...newCodeLines,
        ];
    }

    // console.log({codeLines, lines});

    // return;

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
                if (!lineCode) console.log({ codeToParse, codeObj, lineCode });
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
