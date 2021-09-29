const PluginLoader = require('../plugin_loader');

const jwt = require('express-jwt');
const conf = require('../config/config.js');

module.exports = async function (app) {
	let routeManager = new PluginLoader();
	await routeManager.loadAll('./routes', { app });
};

module.exports.jwtRequired = jwt({ secret: conf('app.jwt.secret'), algorithms: conf('app.jwt.algorithms'), requestProperty: 'auth' });