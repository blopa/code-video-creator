require('@babel/register');
import React from 'react';
import Sample from './Sample.jsx';
import { parse, find } from 'abstract-syntax-tree';
import { renderToStaticMarkup } from "react-dom/server";
const util = require('util');
const babelParser = require("@babel/parser");

module.exports = (code) => {
    // console.log(code);
    // const lala = parse(code);
    // console.log(lala);
    const ast = babelParser.parse(code, {
        sourceType: "module",
        plugins: ["jsx"],
    });
    console.log(util.inspect(ast, {showHidden: false, depth: null, colors: true}))

    return renderToStaticMarkup((
        <Sample
            code={code}
        />
    ));
}
