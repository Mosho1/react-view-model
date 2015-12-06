import React from 'react';
import set from 'lodash/object/set';
import get from 'lodash/object/get';
import assign from 'lodash/object/assign';
import invariant from 'invariant';
import cond from 'conditionals';

const modelPropName = '__model__';
const storePropName = '__store__';

var __DEV__ = process.env.NODE_ENV !== 'production';

const isObject = val => val && typeof val === 'object' && !Array.isArray(val);
const isOfType = testType => val => typeof val === testType;
const isString = isOfType('string');
const isFunction = isOfType('function');
const isUndefined = isOfType('undefined');

const traverse = (obj, cb, context = '') => {
	//proprietary, no hasOwnProperty check
	for (let key in obj) {
		context = context ? context + '.' : '';
		const path = context + key;
		const val = obj[key];
		if (isObject(val)) {
			traverse(val, cb, path);
			cb(val, path);
		} else {
			cb(val, path);
		}
	}
}

const mapObject = (obj, mapFn) => {
	const ret = {};
	traverse(obj, (val, path) => {
		const newVal = mapFn(val, path, ret);
		if (!isUndefined(newVal)) {
			set(ret, path, newVal);
		}
	});
	return ret;
}

const getModelProps = (store, model) =>
	mapObject(model, (val, path) =>
		isString(val) || isFunction(val)
			? get(store, path)
			: undefined);


const getComponentName = Component => Component.displayName || Component.name;

export const store = storeFn => Component => {
	const newComponent = class extends React.Component {
		getChildContext() {
			return {[storePropName]: storeFn()};
		}

		render() {
			return <Component {...this.props}/>;
		}
	}

	newComponent.childContextTypes = newComponent.childContextTypes || {};
	newComponent.childContextTypes[storePropName] = React.PropTypes.object;

	newComponent.displayName = getComponentName(Component);

	return newComponent;
};



export const model = model => Component => {
	const newComponent = class extends React.Component {
		render() {
			const store = this.context[storePropName];
			const modelProps = getModelProps(store, model);
			const propsWithModel = assign(modelProps, this.props);
			return <Component {...propsWithModel} />;
		}
	};

	if (__DEV__) {
		Component.propTypes = mapObject(model, cond(
			[isString, val => React.PropTypes[val]],
			[isFunction, val => val],
			[isObject, (val, path, acc) => React.PropTypes.shape(get(acc, path))]
		));
	}

	newComponent.contextTypes = newComponent.contextTypes || {};
	newComponent.contextTypes[storePropName] = React.PropTypes.object;

	newComponent.displayName = getComponentName(Component);

	return newComponent;
};

const identity = x => x;

const getPropTypeValidator = (validatorName, required) => {
	let validator = React.PropTypes[validatorName];
	validator = required ? validator.required : validator;
	return validator;
};

const getValidator = {
	string(val) {
		const [validatorName, required] = val.split('.');
		const validator = getPropTypeValidator(
			validatorName,
			required,
		);
		return validator;
	},
	function: identity,
	object(val, path, acc) {
		return React.PropTypes.shape(get(acc, path))
	}
};

const schemaMapper = cond(
	[isOfType('string'), getValidator.string],
	[isOfType('function'), getValidator.function],
	[isObject, getValidator.object]
);

const getErrorFormatter = schemaName =>
	error => {
		let {message} = error;
		message= message.replace('undefined', 'schema prop');
		if (schemaName) {
			message = message.replace('<<anonymous>>', schemaName);
		}
		error.message = message;
		return error;
	};

const getSchemaValidator = (schemaName, schemaObj) => {
	const formatError = getErrorFormatter(schemaName);
	const validator = React.PropTypes.shape(mapObject(schemaObj, schemaMapper));
	return obj => {
		let error = validator({obj}, 'obj');
		if (error) {
			error = formatError(error);
			console.error(error);
		}
	}
};

export const schema = (schemaName, schemaObj) => {

	if (!isString(schemaName)) {
		schemaObj = schemaName;
		schemaName = null;
	}

	const validate = getSchemaValidator(schemaName, schemaObj);
	return {validate};
};

export class Schema {
	constructor(schemaName, schemaObj) {

		if (!isString(schemaName)) {
			schemaObj = schemaName;
			schemaName = this.constructor.name;
		}

		this.schema = schema(schemaName, schemaObj);
	}

	validate(obj) {
		return this.schema.validate(obj);
	}
}