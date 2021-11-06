const React = require('react');
// const Sample = require('./Sample.jsx');
import Sample from './Sample.jsx';

const { renderToStaticMarkup } = require("react-dom/server");

module.exports = (code) => {
    return renderToStaticMarkup((
        <Sample
            code={code}
        />
    ));
}
