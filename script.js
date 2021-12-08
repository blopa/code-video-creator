require('@babel/register');
const { generateHtml } = require('./utils');
const nodeHtmlToImage = require('node-html-to-image');
const prettier = require('prettier');
const { readFileSync, writeFileSync, mkdirSync } = require('fs');
const { WIDTH, HEIGHT } = require("./sizes");

const data = readFileSync('./Test.jsx', { encoding: 'utf8' });
const code = prettier.format(data, { parser: "babel" });
// const totalLines = (code.match(/\n/g) || '').length;
const totalLines = code.split('\n');
mkdirSync(`./frames/`, { recursive: true });
// console.log(code, totalLines);

const createScreenshot = async (html, imageName) => {
    await nodeHtmlToImage({
        output: `./frames/${imageName}.png`,
        html,
        type: 'png',
        quality: 100,
        puppeteerArgs: {
            defaultViewport: {
                width: WIDTH,
                height: HEIGHT,
            }
        },
    });

    // console.log(html);
}

totalLines.forEach((line, index) => {
    const html = generateHtml(code, index);
    createScreenshot(html, index);
});

const html = generateHtml(code, 10);
writeFileSync("index.html", html);
