import React from 'react';
import CodeBlock from 'react-highlight-codeblock';
import { HEIGHT, WIDTH, MAX_LINES, SCALE } from "./sizes";

const style = {
    width: `${WIDTH}px`,
    height: `${HEIGHT}px`,
    background: '#272822',
    transform: `scale(${SCALE})`,
    transformOrigin: '0% 0% 0px',
};

const hideCodeStyle = (linesToShow) => {
    return {
        ...style,
        position: 'absolute',
        marginTop: `${22 + (15 * linesToShow)}px`,
    };
};

function CodeHighlighter({
    code,
    language,
    linesToShow = MAX_LINES,
}) {
    return (
        <div style={style}>
            <style
                dangerouslySetInnerHTML={{__html: `
                    .wrapper { background: #272822 }
                `}}
            />
            <div
                id="line-hider"
                style={hideCodeStyle(linesToShow)}
            />
            <CodeBlock
                code={code}
                callback={code => console.log(code)}
                // editer={true}
                language={language}
                style="monokai"
                showLineNumbers
            />
        </div>
    );
}

export default CodeHighlighter;
