#!/usr/bin/env node
require = require('esm')(module);
const minimist = require("minimist");
const generateFiles = require('./script');
const params = minimist(process.argv);
const filePath = params['_'][2] || './examples/Test.jsx';

// config
const {
    smallTabs = false,
    typingSpeed = 1,
    lineDuration = 1,
    blinkTextBar = true,
} = params;

if (
    typeof smallTabs !== 'boolean'
    || typeof blinkTextBar !== 'boolean'
    || !Number.isInteger(typingSpeed)
    || !Number.isInteger(lineDuration)
    || !filePath
) {
    console.error('Invalid arguments', {
        filePath,
        smallTabs,
        typingSpeed,
        lineDuration,
        blinkTextBar,
    })
} else {
    generateFiles(
        filePath, {
            smallTabs,
            typingSpeed,
            lineDuration,
            blinkTextBar,
        }
    );
}
