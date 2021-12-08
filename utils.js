require('@babel/register');
import React from 'react';
import CodeHighlighter from './CodeHighlighter.jsx';
import { renderToStaticMarkup } from "react-dom/server";

// import { parse, find } from 'abstract-syntax-tree';
// import babelGenerator from "@babel/generator";
// const util = require('util');
// const babelParser = require("@babel/parser");

module.exports = (code) => {
    // console.log(code);
    // const lala = parse(code);
    // console.log(lala);
    // const ast = babelParser.parse(code, {
    //     sourceType: "module",
    //     plugins: ["jsx"],
    // });
    //
    // const lele = babelGenerator(ast);
    // console.log(lele);
    // console.log(util.inspect(ast, {showHidden: false, depth: null, colors: true}))

    return renderToStaticMarkup((
        <CodeHighlighter
            code={code}
            language="javascript"
        />
    ));
}
