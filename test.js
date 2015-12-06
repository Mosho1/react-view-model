import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import TestUtils from 'react-addons-test-utils';
// import {jsdom} from 'jsdom';
import {model, store, Schema} from './src.js';
import get from 'lodash/object/get';
// global.window = jsdom().defaultView;
// global.document = global.window.document;

class Test extends Schema {};

const dataSchema = new Test({
	wat: {
		items: 'array'
	}
});

dataSchema.validate({
	wat: {
		items: 1
	}
});

// const Child = model({
// 	wat: {
// 		items: 'array'
// 	}
// })(props =>
// 	<ul>
// 		{get(props, 'wat.items', []).map((item, i) =>
// 			<li key={i}>{item}</li>
// 		)}
// 	</ul>);

// const Parent = store(() => ({
// 	wat: {
// 		items: [1,2,3]
// 	}
// }))(props => {
// 	return <Child/>;
// });

// console.log(ReactDOMServer.renderToStaticMarkup(<Parent/>));