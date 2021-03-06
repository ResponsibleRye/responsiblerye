import injectTapEventPlugin from 'react-tap-event-plugin';
const { JSDOM } = require('jsdom');

const jsdom = new JSDOM(`<!DOCTYPE html>
<html>
<head>
  <title>Mad Maps</title>
</head>
<body>
<div id="app"></div>
<script type="text/javascript" src="bundle.js"></script></body>
</html>`
);
const { window } = jsdom;

function copyProps(src, target) {
  const props = Object.getOwnPropertyNames(src)
    .filter(prop => typeof target[prop] === 'undefined')
    .map(prop => Object.getOwnPropertyDescriptor(src, prop));
  Object.defineProperties(target, props);
}

global.window = window;
global.document = window.document;
global.navigator = {
  userAgent: 'node.js',
};
copyProps(window, global);
injectTapEventPlugin(); //touchTap functionality
