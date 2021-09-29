const Service = require('./_interface');

module.exports = new class Template extends Service {
	constructor() {
		super();
		this._priority = 50; // 1 (High) - 100 (Low)
	}

	async init(_opts = {}) {
		return true;
	}

	async unload() {
		return true;
	}

}();