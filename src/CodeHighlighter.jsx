import React from 'react';
import { HEIGHT, WIDTH, SCALE } from './constants';

const fontFamily = "Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace";

function CodeHighlighter({
    codeHtml,
    totalLines,
    currentLine,
}) {
    const lines = new Array(totalLines).fill(null).map((v, index) => ((
        <span
            key={index}
            className="token string"
            style={{
                // height: '19px',
                width: `${8 * (totalLines).toString().length}px`,
            }}
        >
            {index + 1}
        </span>
    )));

    return (
        <html lang="en">
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    body {
                        color: white;
                    }
                    code > span {
                        //line-height: 19px;
                        //display: inline-block;
                    }
                `,
                }}
            />
            <body
                style={{
                    width: `${WIDTH / SCALE}px`,
                    height: `${HEIGHT / SCALE}px`,
                    background: '#272822',
                    transform: `scale(${SCALE})`,
                    transformOrigin: '0% 0% 0px',
                    margin: 0,
                }}
            >
                <div
                    style={{
                        // background: '#272822',
                        display: 'flex',
                        margin: '20px 0 0 2px',
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            position: 'absolute',
                            height: `${19}px`,
                            backgroundColor: '#44463a',
                            zIndex: -1,
                            marginTop: `${currentLine * 19}px`,
                        }}
                    />
                    <div
                        style={{
                            fontFamily,
                            display: 'grid',
                            margin: '0 5px 0 2px',
                            color: '#DD6',
                        }}
                    >
                        {lines}
                    </div>
                    <pre
                        style={{
                            margin: 0,
                        }}
                    >
                        <code
                            style={{
                                fontFamily,
                            }}
                            dangerouslySetInnerHTML={{
                                __html: codeHtml,
                            }}
                        />
                    </pre>
                </div>
            </body>
        </html>
    );
}

export default CodeHighlighter;
