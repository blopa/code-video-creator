#!/usr/bin/env node
require('dotenv').config();
const minimist = require("minimist");
const generateFiles = require('./script');
const { SCALE } = require('./constants');
const params = minimist(process.argv, {
    boolean: ['smallTabs', 'blinkTextBar', 'showFileName', 'withSpeech'],
    default: {
        smallTabs: false,
        typingSpeed: 1,
        lineSpeed: 1,
        blinkTextBar: true,
        scale: SCALE,
        showFileName: false,
        withSpeech: false,
    }
});
const filePath = params['_'][2] || './examples/Test.jsx';

// config
const {
    smallTabs,
    typingSpeed,
    lineSpeed,
    blinkTextBar,
    scale,
    showFileName,
    withSpeech,
} = params;

if (
    typeof smallTabs !== 'boolean'
    || typeof blinkTextBar !== 'boolean'
    || typeof showFileName !== 'boolean'
    || typeof withSpeech !== 'boolean'
    || Number.isNaN(typingSpeed)
    || Number.isNaN(lineSpeed)
    || Number.isNaN(scale)
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
        withSpeech,
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
            withSpeech,
        }
    );
}
