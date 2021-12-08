import React from 'react';
import CodeBlock from 'react-highlight-codeblock';

function CodeHighlighter({
    code,
    language,
}) {
    return (
        <div>
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
