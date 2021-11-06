import CodeBlock from 'react-highlight-codeblock';
import React from 'react';

function Sample({ code }) {
    return (
        <CodeBlock
            code={code}
            callback={code => console.log(code)}
            // editer={true}
            language="javascript"
            style="monokai"
            showLineNumbers
        />
    );
}

export default Sample;
