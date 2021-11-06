require('@babel/register');
const func = require('./utils');
const nodeHtmlToImage = require('node-html-to-image');
const prettier = require('prettier');

const code = prettier.format("const fund = () => console.log(120101)", { parser: "babel" });

const html = func(code);
const createScreenshot = async (html) => {
    await nodeHtmlToImage({
        output: './image.png',
        html,
    });

    console.log(html);
}

createScreenshot(html);
