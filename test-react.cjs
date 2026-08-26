const React = require('react');
const ReactDOMServer = require('react-dom/server');
const e = React.createElement;
try {
  console.log(ReactDOMServer.renderToString(e('div', { dangerouslySetInnerHTML: { __html: undefined } })));
} catch (err) {
  console.log('Error:', err.message);
}
