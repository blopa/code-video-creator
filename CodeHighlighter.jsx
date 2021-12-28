import React from 'react';
import Prism from "prismjs";
import { HEIGHT, WIDTH, SCALE } from "./sizes";

function CodeHighlighter({
    code,
    language,
    totalLines,
}) {
    const html = Prism.highlight(code, Prism.languages[language], language);
    const lines = new Array(totalLines).fill(null).map((v, index) => {
        return ((
            <span
                key={index}
                style={{
                    height: '16px',
                    width: `${8 * (totalLines).toString().length}px`,
                }}
            >
                {index + 1}
            </span>
        ));
    });

    return (
        <html>
            <style
                dangerouslySetInnerHTML={{__html: `
                    body { color: white; }
                `}}
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
                        background: '#272822',
                        display: 'flex',
                        margin: '20px 0 0 2px',
                    }}
                >
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
                                __html: html,
                            }}
                        />
                    </pre>
                </div>
            </body>
        </html>
    );
}

export default CodeHighlighter;
