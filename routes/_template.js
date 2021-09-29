const RouteLib = require('../_interface');
const conf = require('../config/config.js');

const express = require('express');
const router = express.Router();

module.exports = new class Template extends RouteLib {
	constructor() {
		super();
		this._priority = 50; // 1 (High) - 100 (Low)
	}

	async init(opts = {}) {
		let app = opts.app;

		// router.get('/', async (req, res, next) => {	});

		app.use('/template', router);
		return true;
	}

	async unload() {
		return true;
	}

}();