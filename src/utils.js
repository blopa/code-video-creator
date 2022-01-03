import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { ENCODING } from './constants';

// Code highlighter
import Prism from 'prismjs';
import loadLanguages from 'prismjs/components/';
import CodeHighlighter from './CodeHighlighter.jsx';

const styling = readFileSync(
    './node_modules/prism-themes/themes/prism-material-dark.css',
    { encoding: ENCODING }
);

export const generateHtml = (
    code,
    currentLine,
    totalLines,
    language
) => {
    loadLanguages([language]);
    const codeHtml = Prism.highlight(
        code,
        Prism.languages[language],
        language
    );

    // get HTML string
    const html = renderToStaticMarkup((
        <CodeHighlighter
            codeHtml={codeHtml}
            totalLines={totalLines}
            currentLine={currentLine}
        />
    ));

    const { window } = new JSDOM(html);
    const { document } = window;

    // Add Prism.js styling to the HTML document
    const style = document.createElement('style');
    style.textContent = styling;
    document.head.appendChild(style);

    return document.getElementsByTagName('html')[0].outerHTML;
};
