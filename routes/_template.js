const RouteLib = require('../_interface');
const conf = require('../config/config.js');

const express = require('express');
const router = express.Router();

// const auth = require('../services/authorization');
// const utils = require('../utils');

module.exports = new class Template extends RouteLib {
	constructor() {
		super();
		this._priority = 50; // 1 (High) - 100 (Low)
		this.root = '/tempate';
	}

	async init(opts) {
		let app = opts.app;
		// router.get('/', async (req, res, next) => {	});
		// router.get('/', auth.jwtRequired, async (req, res, next) => { });
		app.use(this.root, router);
		return true;
	}

	async unload() {
		return true;
	}

}();