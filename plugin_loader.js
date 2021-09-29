const RootInterface = require('./_interface');
const fs = require('fs');
const path = require('path');

const readDirRecursive = async (filePath) => {
	const dir = await fs.promises.readdir(filePath);
	const files = await Promise.all(dir.map(async relativePath => {
		const absolutePath = path.join(filePath, relativePath);
		const stat = await fs.promises.lstat(absolutePath);

		return stat.isDirectory() ? readDirRecursive(absolutePath) : absolutePath;
	}));

	return files.flat();
};

module.exports = class PluginLoader extends RootInterface {
	constructor() {
		super();
		this.plugins = {};
		this._loaded = false;
		this._loadPath = '';
	}

	async loadAll(pluginsPath, passData = {}) {
		this._loadPath = pluginsPath;
		// await fs.readdirSync(pathName).forEach((file) => {
		// 	if (!file.startsWith('_') && path.extname(file).toLowerCase() === '.js')
		// 		this.load(pathName + file, false);
		// });
		let files = await readDirRecursive(pluginsPath);
		for (let filePath of files) {
			let dir = path.dirname(filePath);
			let file = path.basename(filePath);
			if (!dir.startsWith('_') && !file.startsWith('_') && path.extname(file).toLowerCase() === '.js')
				this.load(filePath, false);
		}

		// Get plugin priorities, sort to key array
		const sorted = Object.keys(Object.fromEntries(
			Object.entries(this.plugins).sort(([, a], [, b]) => a._priority - b._priority)
		));

		// Now initialize them all
		for (const plugin of sorted) {
			this.plugins[plugin]._initialized = await this.plugins[plugin].init(passData);
		}

		this._loaded = true;
		return true;
	}

	load(pluginPath, manuallyLoaded = true) {
		let id = pluginPath.replace(new RegExp('\\' + path.sep, 'g'), '.').replace('.js', '').split('.').splice(1).join('.');
		if (this.plugins[id]) return false;

		let plugin = require('./' + pluginPath);
		plugin._path = pluginPath;
		plugin._id = id;
		plugin._manuallyLoaded = manuallyLoaded;

		if (!plugin.init) throw `Plugin "${plugin._id}" is missing init function`;
		if (!plugin._priority || !(plugin._priority >= 1 && plugin._priority <= 100)) throw `Plugin "${plugin._id}" is has an invalid _priority value`;

		this.plugins[plugin._id] = plugin;
		this.log(`Loaded: ${pluginPath}`);
		return plugin;

	}

	unload(pluginPath) {
		let path = require.resolve(pluginPath);
		if (!require.cache[path]) return false;
		let plugin = require.cache[path].exports;
		if (plugin.unload) try { plugin.unload(); } catch (err) { this.error(`Error while unloading plugin "${plugin._id}"`); this.error(err); }
		delete this.plugins[plugin._id];
		delete require.cache[path];
		this.log(`Unloaded: ${pluginPath}`);
		return true;
	}

	unloadAll(PluginsPath = './services/') {
		Object.keys(this.plugins).forEach(key => {
			if (!this.plugins[key]._manuallyLoaded && this.plugins[key]._initialized && this.plugins[key]._path.startsWith(PluginsPath))
				this.unload(this.plugins[key]._path);
		});
	}

	get(pluginName) {
		return this.plugins[pluginName];
	}

};