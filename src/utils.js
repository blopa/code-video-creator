require('@babel/register');

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import loadLanguages from 'prismjs/components/';
import Prism from 'prismjs';

import CodeHighlighter from './CodeHighlighter.jsx';

const styling = readFileSync(
    './node_modules/prism-themes/themes/prism-material-dark.css',
    { encoding: 'utf8' }
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

    // console.log({code});
    const reactElement = React.createElement(CodeHighlighter, {
        codeHtml,
        totalLines,
        currentLine,
    }, null);
    const html = renderToStaticMarkup(reactElement);

    const { window } = new JSDOM(html);
    const { document } = window;

    const style = document.createElement('style');
    style.textContent = styling;
    document.head.appendChild(style);

    return document.getElementsByTagName('html')[0].outerHTML;
};

export const getRandomBetween = (max, min) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
