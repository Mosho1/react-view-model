import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import TestUtils from 'react-addons-test-utils';
import {jsdom} from 'jsdom';

global.window = jsdom().defaultView;
global.document = global.window.document;

const modelPropName = '__model__';
const storePropName = '__store__';

const traverse = (obj, cb, context = '') => {
	//propritary, no hasOwnProperty check
	for (let key in obj) {
		const val = obj[key];
		const path = `${context}.${key}`;
		if (typeof val === 'object' && !Array.isArray(val)) {
			traverse(val, cb, path);
		} else {
			cb(val, path);
		}
	}
}

const mapObject = (obj, mapFn) => {
	const ret = {};
	traverse(obj, (val, path) => {
		set(ret, path, mapFn(val, path));
	});
	return ret;
}

const getModelProps = (store, model) =>
	mapObject(model, (val, path) =>
		typeof val === 'string' 
			? get(store, path)
			: val;



const storeDecorator = store => {
	return reactribute([{
		matcher: ({type}) => type[modelPropName] && !type[storePropName] // is a component,
		fn({type, props, children}) {
			const model = type[modelPropName];
			return {props: getModelProps(store, model)};
		}
	}], {deep: true});
};

const getComponentName = Component => Component.displayName || Component.name;

const modelDecorator = model => Component => {
	const newComponent = class extends React.Component {
		constructor(props) {
			super(props);
			this[modelPropName] = model;
		}

		render() {
			return <Component {...this.props} />;
		}
	};

	newComponent.displayName = getComponentName(Component);
	newComponent.propTypes = 
};

