#!/usr/bin/env node
const minimist = require("minimist");
const generateFiles = require('./script');
const { SCALE } = require('./constants');
const params = minimist(process.argv, {
    boolean: ['smallTabs', 'blinkTextBar', 'showFileName'],
});
const filePath = params['_'][2] || './examples/Test.jsx';

// config
const {
    smallTabs = false,
    typingSpeed = 1,
    lineSpeed = 1,
    blinkTextBar = true,
    scale = SCALE,
    showFileName = false,
} = params;

if (
    typeof smallTabs !== 'boolean'
    || typeof blinkTextBar !== 'boolean'
    || typeof showFileName !== 'boolean'
    || !Number.isInteger(typingSpeed)
    || !Number.isInteger(lineSpeed)
    || !Number.isInteger(scale)
    || !filePath
) {
    console.error('Invalid arguments', {
        scale,
        filePath,
        smallTabs,
        typingSpeed,
        lineSpeed,
        blinkTextBar,
        showFileName,
    })
} else {
    generateFiles(
        filePath, {
            scale,
            smallTabs,
            typingSpeed,
            lineSpeed,
            blinkTextBar,
            showFileName,
        }
    );
}
