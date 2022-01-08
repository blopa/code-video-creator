import React from 'react';
import { HEIGHT, WIDTH, SCALE, FONT_SIZE } from './constants';

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
                // height: `${FONT_SIZE}px`,
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
                    code > span {
                        //line-height: ${FONT_SIZE}px;
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
                    color: 'white',
                    fontSize: `${FONT_SIZE}px`,
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
                            height: `${FONT_SIZE}px`,
                            backgroundColor: '#44463a',
                            zIndex: -1,
                            marginTop: `${currentLine * FONT_SIZE}px`,
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
