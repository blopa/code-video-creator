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

export const generateHtml = (code, linesToShow, totalLines) => {
    const html = renderToStaticMarkup((
        <CodeHighlighter
            code={code}
            language="javascript"
            linesToShow={linesToShow}
            totalLines={totalLines}
        />
    ));

    const { window } = new JSDOM(html);
    const { document } = window;

    const style = document.createElement("style");
    style.textContent = styling;
    document.head.appendChild(style);

    return document.getElementsByTagName('html')[0].outerHTML;
}
