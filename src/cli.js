#!/usr/bin/env node
const minimist = require("minimist");
const generateFiles = require('./script');
const params = minimist(process.argv);
const filePath = params['_'][2] || './examples/Test.jsx';

// config
const {
    smallTabs = false,
    typingSpeed = 1,
    lineSpeed = 1,
    blinkTextBar = true,
} = params;

if (
    typeof smallTabs !== 'boolean'
    || typeof blinkTextBar !== 'boolean'
    || !Number.isInteger(typingSpeed)
    || !Number.isInteger(lineSpeed)
    || !filePath
) {
    console.error('Invalid arguments', {
        filePath,
        smallTabs,
        typingSpeed,
        lineSpeed,
        blinkTextBar,
    })
} else {
    generateFiles(
        filePath, {
            smallTabs,
            typingSpeed,
            lineSpeed,
            blinkTextBar,
        }
    );
}
