require('@babel/register');
const { generateHtml } = require('./utils');
const nodeHtmlToImage = require('node-html-to-image');
const prettier = require('prettier');
const { readFileSync, writeFileSync } = require('fs');

const data = readFileSync('./Test.jsx', { encoding: 'utf8' });
const code = prettier.format(data, { parser: "babel" });
const html = generateHtml(code);

const createScreenshot = async (html) => {
    await nodeHtmlToImage({
        output: './image.png',
        html,
        type: 'png',
        quality: 100,
        puppeteerArgs: {
            defaultViewport: {
                width: 1920 / 4,
                height: 1080 / 4,
            }
        },
    });

    // console.log(html);
}

createScreenshot(html);
writeFileSync("index.html", html);
