
// const obj = rx.Observable.interval(1000).take(10);

// const modelDecorator = {
//   wat: {
// 	items: 'array'
//   }
// };

// const Child = modelDecorator(props =>
//   <ul>
// 	{get(props, 'wat.items', []).map((item, i) =>
// 	  <li key={i}>{item}</li>
// 	)}
//   </ul>);


// @store(props => ({
//   wat: {
// 	items: [1, 2, 3]
//   }
// }))
// class Parent extends React.Component {
//   render(props) {
// 	return <Child/>;
//   }
// }


import {expect} from 'chai';
import React from 'react';
import ReactDOM from 'react-dom';
import {model, store, Schema, storePropName} from './src.js';
import get from 'lodash/object/get';
import ReactDOMServer from 'react-dom/server';
import TestUtils from 'react-addons-test-utils';
import {jsdom} from 'jsdom';

global.window = jsdom().defaultView;
global.document = global.window.document;

describe('react-view-model', () => {
  it('should add store to context', () => {

  	const storeObj = {
		wat: {
			items: [1, 2, 3]
		}
	};

	class Parent extends React.Component {

		render(props) {
			return <div/>;
		}
	}

	Parent.contextTypes = {
		[storePropName]: React.PropTypes.any
	};

	const DecoratedParent = store(props => storeObj)(Parent);

	const tree = TestUtils.renderIntoDocument(<DecoratedParent/>);
	const instance = TestUtils.findRenderedComponentWithType(tree, Parent);
	expect(instance.context[storePropName]).to.equal(storeObj);


  });

});
