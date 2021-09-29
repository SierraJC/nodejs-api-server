const Service = require('./_interface');

const jwt = require('express-jwt');
const conf = require('../config/config.js');

module.exports = new class jwtAuth extends Service {
	constructor() {
		super();
		this._priority = 50; // 1 (High) - 100 (Low)

		this.conf = conf('app.jwt'); //? Stored here so every jwtRequired doesnt need to keep calling conf() ?

		this.jwtRequired = jwt({
			secret: this.conf.secret,
			algorithms: this.conf.algorithms,
			requestProperty: 'auth'
		});

	}

	async init(_opts = {}) {
		return this;
	}

	async unload() {
		return true;
	}



}();