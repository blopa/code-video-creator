require('@babel/register');
const func = require('./utils');
const nodeHtmlToImage = require('node-html-to-image');
const prettier = require('prettier');
const fs = require('fs');
const data = fs.readFileSync('./Test.jsx', {encoding:'utf8'});

const code = prettier.format(data, { parser: "babel" });

const html = func(code);

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

    console.log(html);
}

createScreenshot(html);
