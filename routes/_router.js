const PluginLoader = require('../plugin_loader');

module.exports = async function (app) {
	let routeManager = new PluginLoader();
	await routeManager.loadAll('./routes', { app });
	// todo: change router logic, this file should be unecessary. Load routers in app.js
};