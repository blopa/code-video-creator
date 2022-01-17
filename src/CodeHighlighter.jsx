import React from 'react';
import { HEIGHT, WIDTH, FONT_SIZE } from './constants';

const fontFamily = "Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace";

function CodeHighlighter({
    scale,
    codeHtml,
    totalLines,
    currentLine,
    fileName = null,
    subs = null,
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
                    backgroundColor: '#272822',
                    color: 'white',
                    margin: 0,
                }}
            >
                {fileName && (
                    <div
                        style={{
                            width: '100%',
                            height: '17px',
                            backgroundColor: '#404040',
                            position: 'fixed',
                            transform: `scale(${scale})`,
                            transformOrigin: '0% 0% 0px',
                            zIndex: 2,
                            top: 0,
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: '#272822',
                                display: 'table',
                                padding: '0px 5px',
                                // border: '1px solid #22221f',
                                borderBottom: '2px solid #44463a',
                                fontSize: '12px',
                            }}
                        >
                            <p>{fileName}</p>
                        </div>
                    </div>
                )}
                <div
                    style={{
                        width: `${WIDTH / scale}px`,
                        height: `${HEIGHT / scale}px`,
                        transform: `scale(${scale})`,
                        transformOrigin: '0% 0% 0px',
                        fontSize: `${FONT_SIZE}px`,
                        lineHeight: '1em',
                    }}
                >
                    {subs && (
                        <div
                            style={{
                                position: 'absolute',
                                top: `${(HEIGHT / scale) - (22 * scale)}px`,
                                textAlign: 'center',
                                margin: '0 auto',
                                width: '100%',
                                fontSize: '1.5em',
                                boxShadow: '5px 10px #888888',
                            }}
                        >
                            <p>{subs}</p>
                        </div>
                    )}
                    <div
                        style={{
                            // background: '#272822',
                            display: 'flex',
                            margin: `${(fileName ? 20 : 5) * scale}px 0 0 2px`,
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
                </div>
            </body>
        </html>
    );
}

export default CodeHighlighter;
