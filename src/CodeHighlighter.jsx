import React from 'react';
import { HEIGHT, WIDTH, SCALE } from './constants';

function CodeHighlighter({
    codeHtml,
    totalLines,
    currentLine,
}) {
    const lines = new Array(totalLines).fill(null).map((v, index) => ((
        <span
            key={index}
            style={{
                height: '16px',
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
                    body { color: white; }
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
                            height: `${4 * SCALE}px`,
                            backgroundColor: '#44463a',
                            zIndex: -1,
                            marginTop: `${currentLine * 16}px`,
                        }}
                    />
                    <div
                        style={{
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
                                fontFamily: "Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace",
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