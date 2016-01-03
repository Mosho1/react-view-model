import React from 'react';
import set from 'lodash/object/set';
import get from 'lodash/object/get';
import assign from 'lodash/object/assign';
// import invariant from 'invariant';
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
	// proprietary, no hasOwnProperty check
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
};

const mapObject = (obj, mapFn) => {
	const ret = {};
	traverse(obj, (val, path) => {
		const newVal = mapFn(val, path, ret);
		if (!isUndefined(newVal)) {
			set(ret, path, newVal);
		}
	});
	return ret;
};

const getModelProps = (store, model) =>
	mapObject(model, (val, path) =>
		isString(val) || isFunction(val)
			? get(store, path)
			: undefined);


const getComponentName = Component => Component.displayName || Component.name;



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
		return React.PropTypes.shape(get(acc, path));
	}
};

const schemaMapper = cond(
	[isString, getValidator.string],
	[isFunction, getValidator.function],
	[isObject, getValidator.object]
);

const getErrorFormatter = () =>
	error => {
		error.message = error.message.replace('undefined', 'schema prop');
		return error;
	};

const getObjectValidator = (validators, errorFormatter, schemaName) => obj => {
	let error;
	for (let key in obj) {
		error = validators[key](obj, key, schemaName);
		if (error) {
			return console.error(errorFormatter(error));
		}
	}
};

const getPropTypeValidatorsFromObject = obj => mapObject(obj, schemaMapper);

const getSchemaValidator = (schemaName, schemaObj) => {
	const formatError = getErrorFormatter();
	const validators = getPropTypeValidatorsFromObject(schemaObj);
	return getObjectValidator(validators, formatError, schemaName);
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

export const store = storeFn => Component => {
	const newComponent = class extends React.Component {
		getChildContext(props) {
			return {[storePropName]: storeFn(props)};
		}

		render() {
			return <Component {...this.props}/>;
		}
	};

	newComponent.childContextTypes = newComponent.childContextTypes || {};
	newComponent.childContextTypes[storePropName] = React.PropTypes.object;

	newComponent.displayName = getComponentName(Component);

	return newComponent;
};

export const model = modelObj => Component => {
	const newComponent = class extends React.Component {
		render() {
			const storeObj = this.context[storePropName];
			const modelProps = getModelProps(storeObj, modelObj);
			const propsWithModel = assign(modelProps, this.props);
			return <Component {...propsWithModel} />;
		}
	};

	if (__DEV__) {
		Component.propTypes = getPropTypeValidatorsFromObject(model);
	}

	newComponent.contextTypes = newComponent.contextTypes || {};
	newComponent.contextTypes[storePropName] = React.PropTypes.object;

	newComponent.displayName = getComponentName(Component);

	return newComponent;
};
