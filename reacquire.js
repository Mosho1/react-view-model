import chokidar from 'chokidar';
import _throttle from 'lodash.throttle';

/**
 * Runs over the cache to search for all the cached
 * files. taken from http://stackoverflow.com/questions/9210542/node-js-require-cache-possible-to-invalidate/14801711#14801711
 */
const searchCache = (moduleName, callback) => {
    // Resolve the module identified by the specified name
    var mod = require.resolve(moduleName);

    // Check if the module has been resolved and found within
    // the cache
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        // Recursively go over the results
        (function run(mod) {
            // Go over each of the module's children and
            // run over it
            mod.children.forEach(child => run(child));

            // Call the specified callback providing the
            // found module
            callback(mod);
        })(mod);
    }
};

/**
 * Removes a module from the cache
 */
const uncache = moduleName => {
    // Run over the cache looking for the files
    // loaded by the specified module name
    searchCache(moduleName, (mod) =>
        delete require.cache[mod.id]);

    // Remove cached paths to the module.
    Object.keys(module.constructor._pathCache).forEach(cacheKey => {
        if (cacheKey.indexOf(moduleName) > 0) {
            delete module.constructor._pathCache[cacheKey];
        }
    });
};

const getModules = moduleName => {
	let modules = [];
	searchCache(moduleName, mod => modules.push(mod.filename));
	return modules;
}

const getRelativeModules = moduleName => {
	const modules = getModules(moduleName);
	return modules.filter(mod => !mod.includes('node_modules'))
}

const safeRequire = moduleName => {
	try {
		require(moduleName);
	} catch(e) {
		console.error(e.stack || e);
	}
}

const reloadModule = (moduleName, throttle) => _throttle((mod) => {
	uncache(moduleName);
	safeRequire(moduleName);
}, throttle, {trailing: false});

export default (moduleName, {watch = true, throttle = 500, watchModules = false} = {}) => {

	safeRequire(moduleName);

	let modules = watchModules 
		? getModules(moduleName)
		: getRelativeModules(moduleName);

	const reload = reloadModule(moduleName, throttle);
	chokidar.watch(modules)
		.on('add', reload)
		.on('change', reload)
		.on('unlink', reload);

};