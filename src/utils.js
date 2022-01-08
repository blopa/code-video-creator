const path = require('path');
const React = require('react');
const { renderToStaticMarkup } = require ('react-dom/server');
const { JSDOM } = require('jsdom');
const { readFileSync } = require('fs');
const loadLanguages = require('prismjs/components/');
const Prism = require('prismjs');
const { transformFileSync } = require('@babel/core');
const { requireFromString } = require('module-from-string');
const babelConfig = require('../babel.config');

// React component
const { code } = transformFileSync(
    path.resolve(__dirname, 'CodeHighlighter.jsx'), {
        ...babelConfig,
        root: path.resolve(__dirname, '..')
    }
);
const { default: CodeHighlighter } = requireFromString(code);

const styling = readFileSync(
    path.resolve(__dirname, '..', 'node_modules', 'prism-themes', 'themes', 'prism-material-dark.css'),
    { encoding: 'utf8' }
);

const generateHtml = (
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

const getRandomBetween = (max, min) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

module.exports = {
    generateHtml,
    getRandomBetween,
};
