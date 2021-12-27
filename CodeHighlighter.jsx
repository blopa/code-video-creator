import React from 'react';
import Prism from "prismjs";
// import "prism-themes/themes/prism-cb.css";
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
    totalLines,
}) {
    const html = Prism.highlight(code, Prism.languages[language], language);
    const lines = new Array(totalLines + 1).fill(null).map((v, index) => {
        return `<span>${index + 1}</span>`;
    }).join('');

    return (
        <html>
            <style
                dangerouslySetInnerHTML={{__html: `
                    .wrapper { background: #272822; display: flex; }
                    .lines { display: grid; }
                `}}
            />
            <body style={getMainStyle(linesToShow)}>
                <div className="wrapper">
                    <div
                        className="lines"
                        dangerouslySetInnerHTML={{
                            __html: lines,
                        }}
                    />
                    <div
                        id="line-hider"
                        style={getHideCodeStyle(linesToShow)}
                    />
                    <pre>
                        <code
                            style={{ fontFamily: "Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace" }}
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
