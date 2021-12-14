import React from 'react';
import CodeBlock from 'react-highlight-codeblock';
import { HEIGHT, WIDTH, MAX_LINES, SCALE } from "./sizes";

const getMainStyle = (linesToShow) => {
    const linePad = Math.max(0, linesToShow - MAX_LINES);

    return {
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        background: '#272822',
        transform: `scale(${SCALE})`,
        transformOrigin: '0% 0% 0px',
        margin: 0,
        marginTop: `-${7 * SCALE}`,
        ...linePad && {
            marginTop: `-${(22 * SCALE) + ((15 * SCALE) * (linePad - 1))}`,
        }
    };
};

const getHideCodeStyle = (linesToShow) => {
    return {
        background: '#272822',
        height: '100vh',
        width: '100%',
        position: 'absolute',
        marginTop: `${22 + (15 * (linesToShow - 1))}px`,
        marginLeft: '32px',
    };
};

function CodeHighlighter({
    code,
    language,
    linesToShow = MAX_LINES,
}) {
    return (
        <html>
            <style
                dangerouslySetInnerHTML={{__html: `
                    .wrapper { background: #272822 }
                `}}
            />
            <body style={getMainStyle(linesToShow)}>
                <div
                    id="line-hider"
                    style={getHideCodeStyle(linesToShow)}
                />
                <CodeBlock
                    code={code}
                    callback={code => console.log(code)}
                    // editer={true}
                    language={language}
                    style="monokai"
                    showLineNumbers
                />
            </body>
        </html>
    );
}

export default CodeHighlighter;
