import React from 'react';
import CodeBlock from 'react-highlight-codeblock';
import { HEIGHT, WIDTH } from "./sizes";

const style = {
    width: `${WIDTH}px`,
    height: `${HEIGHT}px`,
    background: '#272822',
};

const hideCodeStyle = (lines) => {
    return {
        ...style,
        position: 'absolute',
        marginTop: `${24 + (15 * lines)}px`,
    };
};

function CodeHighlighter({
    code,
    language,
    linesToShow = 45,
}) {
    return (
        <div style={style}>
            <style
                dangerouslySetInnerHTML={{__html: `
                    .wrapper { background: #272822 }
                `}}
            />
            <div style={hideCodeStyle(linesToShow)} />
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
