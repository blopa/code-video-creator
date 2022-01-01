require('@babel/register');
import React from 'react';
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";

import CodeHighlighter from './CodeHighlighter.jsx';

const styling = readFileSync(
    './node_modules/prism-themes/themes/prism-material-dark.css',
    { encoding: 'utf8' }
);

export const generateHtml = (code, currentLine, totalLines) => {
    const html = renderToStaticMarkup((
        <CodeHighlighter
            code={code}
            language="javascript"
            totalLines={totalLines}
            currentLine={currentLine}
        />
    ));

    const { window } = new JSDOM(html);
    const { document } = window;

    const style = document.createElement("style");
    style.textContent = styling;
    document.head.appendChild(style);

    return document.getElementsByTagName('html')[0].outerHTML;
}

export const getRandomBetween = (max, min) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
