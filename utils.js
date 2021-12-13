require('@babel/register');
import React from 'react';
import CodeHighlighter from './CodeHighlighter.jsx';
import { renderToStaticMarkup } from "react-dom/server";

export const generateHtml = (code, linesToShow) => {
    return renderToStaticMarkup((
        <CodeHighlighter
            code={code}
            language="javascript"
            linesToShow={linesToShow}
        />
    ));
}
