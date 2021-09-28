const RootInterface = require('./_interface');
const fs = require('fs');
const path = require('path');

class PluginLoader extends RootInterface {
	constructor() {
		super();
		this.plugins = {};
		this._loaded = false;
	}

	async loadAll(pathName = './services/') {

		await fs.readdirSync(pathName).forEach((file) => {
			if (!file.startsWith('_') && path.extname(file).toLowerCase() === '.js')
				this.load(pathName + file, false);
		});

		// Get plugin priorities, sort to key array
		const sorted = Object.keys(Object.fromEntries(
			Object.entries(this.plugins).sort(([, a], [, b]) => a._priority - b._priority)
		));

		// Now initialize them all
		for (const plugin of sorted) {
			this.plugins[plugin]._initialized = await this.plugins[plugin].init();
		}

		this._loaded = true;
		return true;
	}

	load(pluginPath, manuallyLoaded = true) {
		let id = path.basename(pluginPath, '.js');
		if (this.plugins[id]) return false;

		let plugin = require(pluginPath);
		plugin.path = pluginPath;
		plugin.id = id;
		plugin.manuallyLoaded = manuallyLoaded;

		if (!plugin.init) throw `Plugin "${plugin.id}" is missing init function`;
		if (!plugin._priority || !(plugin._priority >= 1 && plugin._priority <= 100)) throw `Plugin "${plugin.id}" is has an invalid _priority value`;

		this.plugins[plugin.id] = plugin;
		this.log(`Loaded: ${pluginPath}`);
		return plugin;

	}

	unload(pluginPath) {
		let path = require.resolve(pluginPath);
		if (!require.cache[path]) return false;
		let plugin = require.cache[path].exports;
		if (plugin.unload) try { plugin.unload(); } catch (err) { this.error(`Error while unloading plugin "${plugin.id}"`); this.error(err); }
		delete this.plugins[plugin.id];
		delete require.cache[path];
		this.log(`Unloaded: ${pluginPath}`);
		return true;
	}

	unloadAll(pathName = './services/') {
		Object.keys(this.plugins).forEach(key => {
			if (!this.plugins[key].manuallyLoaded && this.plugins[key]._initialized && this.plugins[key].path.startsWith(pathName))
				this.unload(this.plugins[key].path);
		});
	}

	get(pluginName) {
		return this.plugins[pluginName];
	}

}

module.exports = new PluginLoader();